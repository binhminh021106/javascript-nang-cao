<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import Swal from 'sweetalert2';
import { io } from "socket.io-client";

// --- CẤU HÌNH TOAST (Đồng bộ với ProductList) ---
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

// --- STATE ---
const categories = ref([]);
const isLoading = ref(false);
const searchQuery = ref("");
const socket = io("http://localhost:8080");

// Pagination
const pageInfo = reactive({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false
});

// Modal & Form
const isModalVisible = ref(false);
const modalMode = ref('add'); // 'add' | 'edit'
const isSubmitting = ref(false);

const formData = reactive({
    id: null,
    name: '',
    icon: '',
    status: 'active'
});

// State lỗi (Validation)
const errors = reactive({
    name: '',
    icon: ''
});

// --- API FUNCTIONS (Chuyển sang fetch cho đồng bộ) ---
const fetchCategories = async () => {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
        const queryParams = new URLSearchParams({
            page: pageInfo.page,
            limit: pageInfo.limit,
            search: searchQuery.value
        });

        const res = await fetch(`http://localhost:8080/api/categories?${queryParams}`);
        if (!res.ok) throw new Error("Lỗi kết nối");

        const data = await res.json();

        categories.value = data.data;
        pageInfo.total = data.total;
        pageInfo.hasMore = pageInfo.page * pageInfo.limit < pageInfo.total;
    } catch (error) {
        console.error("Lỗi tải danh mục:", error);
        Toast.fire({ icon: 'error', title: 'Không thể tải danh sách danh mục!' });
    } finally {
        isLoading.value = false;
    }
};

// --- VALIDATION ---
const validateForm = () => {
    let isValid = true;

    // Reset lỗi cũ
    errors.name = '';
    errors.icon = '';

    // 1. Validate Tên
    if (!formData.name || formData.name.trim() === '') {
        errors.name = 'Vui lòng nhập tên danh mục.';
        isValid = false;
    } else {
        // 2. Validate Trùng tên (Client-side check trên danh sách đang hiển thị)
        // Lưu ý: Để check triệt để toàn database, nên xử lý thêm ở backend trả về lỗi
        const isDuplicate = categories.value.some(cat =>
            cat.name.toLowerCase() === formData.name.trim().toLowerCase() &&
            cat.id !== formData.id // Bỏ qua chính nó khi đang Edit
        );

        if (isDuplicate) {
            errors.name = 'Tên danh mục này đã tồn tại!';
            isValid = false;
        }
    }

    return isValid;
};

// Hàm xóa lỗi khi người dùng nhập liệu
const clearError = (field) => {
    if (errors[field]) errors[field] = '';
};

// --- HANDLERS ---
const handleSearch = () => {
    pageInfo.page = 1;
    fetchCategories();
};

// Watch search debounce
let searchTimeout;
watch(searchQuery, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(handleSearch, 500);
});

const prevPage = () => {
    if (pageInfo.page > 1) {
        pageInfo.page--;
        fetchCategories();
    }
};

const nextPage = () => {
    if (pageInfo.hasMore) {
        pageInfo.page++;
        fetchCategories();
    }
};

// Modal Logic
const openModal = (mode, category = null) => {
    modalMode.value = mode;
    isModalVisible.value = true;

    // Reset errors khi mở modal
    errors.name = '';
    errors.icon = '';

    if (mode === 'edit' && category) {
        formData.id = category.id;
        formData.name = category.name;
        formData.icon = category.icon;
        formData.status = category.status;
    } else {
        // Reset form for add
        formData.id = null;
        formData.name = '';
        formData.icon = 'fa-solid fa-layer-group';
        formData.status = 'active';
    }
};

const closeModal = () => {
    isModalVisible.value = false;
};

// Submit Add/Edit
const handleSubmit = async () => {
    // VALIDATE
    if (!validateForm()) {
        return;
    }

    isSubmitting.value = true;
    try {
        const url = modalMode.value === 'add'
            ? 'http://localhost:8080/api/categories'
            : `http://localhost:8080/api/categories/${formData.id}`;

        const method = modalMode.value === 'add' ? 'POST' : 'PUT';

        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error("Lỗi khi lưu danh mục");

        closeModal();

        Toast.fire({
            icon: 'success',
            title: modalMode.value === 'add' ? 'Thêm danh mục thành công!' : 'Cập nhật thành công!'
        });

    } catch (error) {
        console.error(error);
        Toast.fire({ icon: 'error', title: 'Đã xảy ra lỗi khi lưu!' });
    } finally {
        isSubmitting.value = false;
    }
};

// Delete
const handleDelete = async (category) => {
    const result = await Swal.fire({
        title: 'Bạn chắc chắn chứ?',
        text: `Xóa danh mục "${category.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Vâng, xóa đi!',
        cancelButtonText: 'Hủy bỏ'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`http://localhost:8080/api/categories/${category.id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error("Lỗi khi xóa");

            Toast.fire({ icon: 'success', title: 'Đã xóa danh mục!' });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể xóa danh mục này.',
                confirmButtonColor: '#000'
            });
        }
    }
};

// --- LIFECYCLE ---
onMounted(() => {
    fetchCategories();

    socket.on("REFRESH_CATEGORIES", () => {
        fetchCategories();
    });
});

onUnmounted(() => {
    socket.off("REFRESH_CATEGORIES");
    socket.disconnect();
});
</script>

<template>
    <div>
        <!-- 1. Header & Actions -->
        <div class="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-6 gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Danh mục</h1>
                <p class="text-sm text-gray-500 mt-1">Phân loại sản phẩm và quản lý icon hiển thị.</p>
            </div>
            <button @click="openModal('add')"
                class="bg-black text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition shadow-sm flex items-center gap-2">
                <i class="fa-solid fa-plus"></i> Thêm danh mục
            </button>
        </div>

        <!-- 2. Search -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div class="relative max-w-md">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </span>
                <input v-model="searchQuery" type="text"
                    class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition text-sm"
                    placeholder="Tìm kiếm danh mục..." />
            </div>
        </div>

        <!-- 3. Table Data -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full whitespace-nowrap text-left text-sm">
                    <thead class="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th class="px-6 py-4">ID</th>
                            <th class="px-6 py-4">Tên danh mục</th>
                            <th class="px-6 py-4">Icon hiển thị</th>
                            <th class="px-6 py-4 text-center">Số lượng SP</th>
                            <th class="px-6 py-4">Trạng thái</th>
                            <th class="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>

                    <tbody class="divide-y divide-gray-100">
                        <tr v-if="isLoading">
                            <td colspan="6" class="px-6 py-10 text-center text-gray-400">
                                <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i>
                                <p>Đang tải dữ liệu...</p>
                            </td>
                        </tr>

                        <tr v-else-if="categories.length === 0">
                            <td colspan="6" class="px-6 py-10 text-center text-gray-400">
                                <p>Chưa có danh mục nào.</p>
                            </td>
                        </tr>

                        <tr v-else v-for="cat in categories" :key="cat.id" class="hover:bg-gray-50 transition">
                            <td class="px-6 py-4 text-gray-500">#{{ cat.id }}</td>

                            <td class="px-6 py-4 font-semibold text-gray-900">
                                {{ cat.name }}
                            </td>

                            <td class="px-6 py-4">
                                <div
                                    class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200">
                                    <i :class="cat.icon || 'fa-solid fa-folder'"></i>
                                </div>
                                <span class="text-xs text-gray-400 mt-1 block">{{ cat.icon }}</span>
                            </td>

                            <td class="px-6 py-4 text-center font-medium">
                                {{ cat.count }}
                            </td>

                            <td class="px-6 py-4">
                                <span
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                                    :class="cat.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'">
                                    <span class="w-1.5 h-1.5 rounded-full"
                                        :class="cat.status === 'active' ? 'bg-green-500' : 'bg-gray-400'"></span>
                                    {{ cat.status === 'active' ? 'Hiển thị' : 'Đang ẩn' }}
                                </span>
                            </td>

                            <td class="px-6 py-4 text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <button @click="openModal('edit', cat)"
                                        class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="Sửa">
                                        <i class="fa-solid fa-pen-to-square"></i>
                                    </button>
                                    <button @click="handleDelete(cat)"
                                        class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Xóa">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div v-if="!isLoading && categories.length > 0"
                class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <span class="text-xs text-gray-500">
                    Trang <span class="font-semibold text-gray-900">{{ pageInfo.page }}</span>
                    (Tổng {{ pageInfo.total }} danh mục)
                </span>
                <div class="flex gap-2">
                    <button @click="prevPage" :disabled="pageInfo.page <= 1"
                        class="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                        Trước
                    </button>
                    <button @click="nextPage" :disabled="!pageInfo.hasMore"
                        class="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                        Sau
                    </button>
                </div>
            </div>
        </div>

        <!-- 4. MODAL FORM -->
        <div v-if="isModalVisible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div @click="closeModal" class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>

            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">

                <!-- Modal Header -->
                <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 class="text-lg font-bold text-gray-900">
                        {{ modalMode === 'add' ? 'Thêm Danh Mục Mới' : 'Cập Nhật Danh Mục' }}
                    </h3>
                    <button @click="closeModal"
                        class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6">
                    <form @submit.prevent="handleSubmit" class="space-y-5" novalidate>

                        <!-- Tên danh mục -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tên Danh Mục <span
                                    class="text-red-500">*</span></label>
                            <input v-model="formData.name" type="text" @input="clearError('name')"
                                placeholder="Ví dụ: Áo thun, Quần tây..."
                                :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-200': errors.name }"
                                class="w-full px-4 py-2 border rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition" />
                            <span v-if="errors.name" class="text-red-500 text-xs mt-1 block">{{ errors.name }}</span>
                        </div>

                        <!-- Icon & Preview -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class Icon (FontAwesome)</label>
                            <div class="flex gap-3">
                                <input v-model="formData.icon" type="text" placeholder="Ví dụ: fa-solid fa-shirt"
                                    class="flex-1 px-4 py-2 border rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none font-mono text-sm" />

                                <!-- Preview Box -->
                                <div class="w-10 h-10 flex-shrink-0 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-700"
                                    title="Xem trước icon">
                                    <i :class="formData.icon || 'fa-solid fa-question'"></i>
                                </div>
                            </div>
                            <p class="text-xs text-gray-400 mt-1">Tìm icon tại: <a
                                    href="https://fontawesome.com/search?o=r&m=free" target="_blank"
                                    class="text-blue-500 hover:underline">FontAwesome Free</a></p>
                        </div>

                        <!-- Trạng thái -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
                            <select v-model="formData.status"
                                class="w-full px-4 py-2 border rounded-lg focus:border-black outline-none bg-white">
                                <option value="active">Hiển thị (Active)</option>
                                <option value="hidden">Ẩn (Hidden)</option>
                            </select>
                        </div>

                        <!-- Footer Actions -->
                        <div class="pt-4 border-t flex justify-end gap-3 mt-6">
                            <button type="button" @click="closeModal"
                                class="px-5 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50">Hủy</button>
                            <button type="submit" :disabled="isSubmitting"
                                class="px-5 py-2.5 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center">
                                <i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin mr-2"></i>
                                {{ isSubmitting ? 'Đang lưu...' : 'Lưu lại' }}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.animate-fade-in-up {
    animation: fadeInUp 0.2s ease-out forwards;
}
</style>