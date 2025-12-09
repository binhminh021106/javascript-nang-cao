<script setup>
// --- 1. IMPORT THƯ VIỆN ---
import { ref, computed, onMounted, reactive, onBeforeUnmount } from 'vue';
import { io } from 'socket.io-client';
import Swal from 'sweetalert2';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

// --- 2. CẤU HÌNH TOAST (Thông báo góc màn hình) ---
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

// --- 3. KHAI BÁO BIẾN TRẠNG THÁI (STATE) ---
let socket = null; // Biến giữ kết nối Socket.IO

// Dữ liệu API và trạng thái tải
const apiResponse = ref(null);
const isLoading = ref(false);
const isSubmitting = ref(false);

// Bộ lọc và Phân trang
const currentPage = ref(1);
const searchQuery = ref("");
const filterStatus = ref("");
const categories = ref([]); 

// Ref tham chiếu đến input file để reset sau khi upload
const fileInput = ref(null);

// Trạng thái Modal (Ẩn/Hiện, Chế độ xem/thêm/sửa)
const isModalVisible = ref(false);
const modalMode = ref('view');

// Dữ liệu Form (Dùng cho Thêm và Sửa)
const formData = reactive({
  id: null,
  name: '',
  price: 0,
  quantity: 0,
  description: '',
  category_id: null, 
  images: [],
  imageFiles: [], // File gốc để upload
  status: 1
});

// Biến lưu lỗi Validation
const errors = reactive({
  name: '',
  price: '',
  quantity: '',
  category_id: ''
});

// --- 4. CÁC HÀM TIỆN ÍCH (HELPER) ---

// Loại bỏ thẻ HTML để hiển thị mô tả ngắn gọn trên bảng
const stripHtml = (html) => {
  if (!html) return "Chưa có mô tả";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  let text = tmp.textContent || tmp.innerText || "";
  text = text.replace(/\s+/g, ' ').trim();
  return text.length > 60 ? text.substring(0, 60) + "..." : text;
};

// Format tiền tệ (VNĐ)
const formatPrice = (price) => {
  if (typeof price !== "number") return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
};

// Tạo ảnh placeholder nếu lỗi hoặc chưa có ảnh
const placeholderImage = (name = "IMG") => {
  if (!name) name = "Sp";
  return `https://placehold.co/100x100/f3f4f6/9ca3af?text=${encodeURI(name.substring(0, 3).toUpperCase())}`;
};

// Xử lý khi ảnh bị lỗi (gắn ảnh mặc định)
const handleImageError = (event) => {
  if (event.target.src !== placeholderImage("ERR")) {
    event.target.src = placeholderImage("ERR");
  }
};

// --- 5. VALIDATION (KIỂM TRA DỮ LIỆU) ---
const validateForm = () => {
  let isValid = true;
  
  // Reset lỗi cũ
  errors.name = '';
  errors.price = '';
  errors.quantity = '';
  errors.category_id = '';

  // Kiểm tra Tên
  if (!formData.name || String(formData.name).trim() === '') {
    errors.name = 'Tên sản phẩm không được để trống.';
    isValid = false;
  }

  // Kiểm tra Giá (Phải là số, không âm)
  if (formData.price === '' || formData.price === null || formData.price === undefined) {
    errors.price = 'Vui lòng nhập giá bán.';
    isValid = false;
  } else if (isNaN(Number(formData.price))) {
    errors.price = 'Giá bán phải là số hợp lệ.';
    isValid = false;
  } else if (Number(formData.price) < 0) {
    errors.price = 'Giá bán không được nhỏ hơn 0.';
    isValid = false;
  }

  // Kiểm tra Số lượng (Phải là số, không âm)
  if (formData.quantity === '' || formData.quantity === null || formData.quantity === undefined) {
    errors.quantity = 'Vui lòng nhập số lượng.';
    isValid = false;
  } else if (isNaN(Number(formData.quantity))) {
    errors.quantity = 'Số lượng phải là số hợp lệ.';
    isValid = false;
  } else if (Number(formData.quantity) < 0) {
    errors.quantity = 'Số lượng không được nhỏ hơn 0.';
    isValid = false;
  }

  // Kiểm tra Danh mục
  if (!formData.category_id) {
    errors.category_id = 'Vui lòng chọn danh mục.';
    isValid = false;
  }

  return isValid;
};

// Xóa lỗi khi người dùng bắt đầu nhập liệu lại
const clearError = (field) => {
  if (errors[field]) errors[field] = '';
};

// --- 6. COMPUTED (TÍNH TOÁN DỮ LIỆU) ---

// Lọc danh sách sản phẩm theo Tìm kiếm và Trạng thái
const products = computed(() => {
  let data = apiResponse.value?.data || [];

  if (searchQuery.value) {
    const lower = searchQuery.value.toLowerCase();
    data = data.filter(p => p.name.toLowerCase().includes(lower));
  }

  if (filterStatus.value !== "") {
    data = data.filter(p => p.status === parseInt(filterStatus.value));
  }

  return data;
});

// Thông tin phân trang
const pageInfo = computed(() => {
  if (!apiResponse.value) return { page: 1, limit: 10, hasMore: false, total: 0 };
  return {
    page: apiResponse.value.page,
    limit: apiResponse.value.limit,
    hasMore: apiResponse.value.data.length === apiResponse.value.limit,
    total: apiResponse.value.total || 'N/A'
  };
});

// --- 7. CÁC HÀM XỬ LÝ CHÍNH (METHODS) ---

// Lấy danh sách danh mục để đổ vào Select box
const fetchCategoriesForDropdown = async () => {
    try {
        const res = await fetch('/api/categories-all');
        if(res.ok) {
            categories.value = await res.json();
        }
    } catch (e) {
        console.error("Lỗi tải danh mục dropdown", e);
    }
};

// Xử lý chọn file ảnh (Preview ảnh ngay lập tức)
const handleFileUpload = (event) => {
  const files = Array.from(event.target.files);

  files.forEach(file => {
    if (!file.type.startsWith('image/')) {
      Toast.fire({ icon: 'error', title: `${file.name} không phải là file ảnh!` });
      return;
    }
    formData.imageFiles.push(file);
    formData.images.push(URL.createObjectURL(file));
  });
};

// Xóa ảnh khỏi danh sách upload
const removeImage = (index) => {
  formData.images.splice(index, 1);
  formData.imageFiles.splice(index, 1);
};

// Lấy dữ liệu sản phẩm từ API
const fetchData = async (page) => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    const res = await fetch(`/api/home?page=${page}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    apiResponse.value = await res.json();
    currentPage.value = apiResponse.value.page;
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
    Toast.fire({ icon: 'error', title: 'Lỗi tải dữ liệu!' });
  } finally {
    isLoading.value = false;
  }
};

// Chuyển trang
const prevPage = () => { if (pageInfo.value.page > 1) fetchData(pageInfo.value.page - 1); };
const nextPage = () => { if (pageInfo.value.hasMore) fetchData(pageInfo.value.page + 1); };

// Mở Modal (Reset form nếu là thêm mới, điền dữ liệu nếu là sửa/xem)
const openModal = (mode, product = null) => {
  modalMode.value = mode;
  if (fileInput.value) fileInput.value.value = null; // Reset input file

  // Reset lỗi
  errors.name = ''; errors.price = ''; errors.quantity = ''; errors.category_id = '';

  if (mode === 'add') {
    // Reset form về rỗng
    Object.assign(formData, { 
      id: null, name: '', price: 0, quantity: 0, description: '', category_id: null, 
      images: [], imageFiles: [], status: 1 
    });
  } else if (product) {
    // Đổ dữ liệu sản phẩm vào form
    const imgs = product.image ? product.image.split(",") : [];
    Object.assign(formData, {
      ...product,
      category_id: product.category_id,
      quantity: product.quantity || 0,
      images: imgs,
      imageFiles: []
    });
    if (!formData.description) formData.description = '';
  }
  isModalVisible.value = true;
  document.body.style.overflow = "hidden"; // Khóa cuộn body
};

// Đóng Modal
const closeModal = () => {
  isModalVisible.value = false;
  document.body.style.overflow = "";
};

// Xử lý Submit Form (Thêm hoặc Sửa)
const handleSubmit = async () => {
  // 1. Kiểm tra dữ liệu đầu vào
  if (!validateForm()) return; 

  if (isSubmitting.value) return;
  isSubmitting.value = true;

  try {
    const url = modalMode.value === 'add' ? '/api/products' : `/api/products/${formData.id}`;
    const method = modalMode.value === 'add' ? 'POST' : 'PUT';

    // 2. Tạo FormData để gửi dữ liệu (bao gồm cả file)
    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('price', formData.price);
    payload.append('quantity', formData.quantity);
    payload.append('description', formData.description || '');
    payload.append('status', formData.status);
    payload.append('category_id', formData.category_id || 'null');

    // Xử lý ảnh: Nếu có ảnh mới thì gửi ảnh, không thì giữ ảnh cũ
    if (formData.imageFiles.length > 0) {
      formData.imageFiles.forEach(file => payload.append('images', file));
      payload.append('keepOldImages', 'false');
    } else {
      payload.append('keepOldImages', 'true');
    }

    // 3. Gửi request lên Server
    const res = await fetch(url, { method: method, body: payload });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Lỗi khi lưu sản phẩm");
    }

    closeModal();
    Toast.fire({
      icon: 'success',
      title: modalMode.value === 'add' ? 'Thêm mới thành công!' : 'Cập nhật thành công!'
    });

  } catch (error) {
    console.error(error);
    Swal.fire({ icon: 'error', title: 'Đã xảy ra lỗi', text: error.message, confirmButtonColor: '#000' });
  } finally {
    isSubmitting.value = false;
  }
};

// Xử lý Xóa sản phẩm
const handleDelete = async (product) => {
  const result = await Swal.fire({
    title: 'Bạn có chắc chắn?',
    text: `Bạn muốn xóa sản phẩm "${product.name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Vâng, xóa đi!',
    cancelButtonText: 'Hủy bỏ'
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Lỗi khi xóa sản phẩm");
    Toast.fire({ icon: 'success', title: 'Đã xóa sản phẩm!' });
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Lỗi', text: "Không thể xóa sản phẩm này." });
  }
};

// --- 8. LIFECYCLE HOOKS (VÒNG ĐỜI) ---
onMounted(() => {
  fetchData(currentPage.value);
  fetchCategoriesForDropdown();
  
  // Kết nối Socket.IO để nhận lệnh làm mới dữ liệu realtime
  socket = io("http://localhost:8080");
  socket.on("REFRESH_DATA", () => {
    console.log("📡 Nhận tín hiệu REFRESH_DATA");
    fetchData(currentPage.value);
  });
});

onBeforeUnmount(() => {
  if (socket) socket.disconnect();
});
</script>

<template>
  <div>

    <!-- 1. HEADER & NÚT THÊM MỚI -->
    <div class="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Danh sách sản phẩm</h1>
        <p class="text-sm text-gray-500 mt-1">Quản lý kho hàng và thông tin sản phẩm.</p>
      </div>
      <button @click="openModal('add')"
        class="bg-black text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition shadow-sm flex items-center gap-2">
        <i class="fa-solid fa-plus"></i> Thêm mới
      </button>
    </div>

    <!-- 2. THANH TÌM KIẾM & LỌC -->
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Input Tìm kiếm -->
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <i class="fa-solid fa-magnifying-glass"></i>
          </span>
          <input v-model="searchQuery" type="text"
            class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition text-sm"
            placeholder="Tìm kiếm theo tên sản phẩm..." />
        </div>

        <!-- Dropdown Lọc trạng thái -->
        <div class="w-full md:w-64">
          <div class="relative">
            <select v-model="filterStatus"
              class="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-black outline-none appearance-none text-sm cursor-pointer">
              <option value="">Tất cả trạng thái</option>
              <option value="1">Đang bán</option>
              <option value="0">Hết hàng</option>
            </select>
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <i class="fa-solid fa-chevron-down text-xs"></i>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. BẢNG DỮ LIỆU -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full whitespace-nowrap text-left text-sm">
          <thead class="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th class="px-6 py-4">Sản phẩm</th>
              <th class="px-6 py-4">Danh mục</th>
              <th class="px-6 py-4">Kho</th> <!-- Cột Số lượng -->
              <th class="px-6 py-4">Giá bán</th>
              <th class="px-6 py-4">Trạng thái</th>
              <th class="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <!-- Loading -->
            <tr v-if="isLoading">
              <td colspan="6" class="px-6 py-10 text-center text-gray-400">
                <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i>
                <p>Đang tải dữ liệu...</p>
              </td>
            </tr>

            <!-- Không có dữ liệu -->
            <tr v-else-if="products.length === 0">
              <td colspan="6" class="px-6 py-10 text-center text-gray-400">
                <i class="fa-solid fa-box-open text-4xl mb-2 text-gray-300"></i>
                <p>Không tìm thấy sản phẩm nào.</p>
              </td>
            </tr>

            <!-- Hiển thị danh sách -->
            <tr v-else v-for="product in products" :key="product.id" class="hover:bg-gray-50 transition">
              <td class="px-6 py-4">
                <div class="flex items-center gap-4 group cursor-pointer" @click="openModal('view', product)">
                  <img :src="product.image?.split(',')[0] || placeholderImage(product.name)"
                    class="w-12 h-12 rounded-lg object-cover border border-gray-200 group-hover:border-gray-400 transition"
                    @error="handleImageError" />
                  <div>
                    <div class="font-semibold text-gray-900 group-hover:text-black group-hover:underline">{{
                      product.name }}</div>
                    <div class="text-gray-500 text-xs mt-0.5 truncate max-w-[200px]">
                      {{ stripHtml(product.description) }}
                    </div>
                  </div>
                </div>
              </td>
              
              <td class="px-6 py-4 text-gray-600">
                  <span v-if="product.category_name" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {{ product.category_name }}
                  </span>
                  <span v-else class="text-gray-400 italic text-xs">Chưa phân loại</span>
              </td>

              <td class="px-6 py-4 font-medium text-gray-700">
                  {{ product.quantity || 0 }}
              </td>

              <td class="px-6 py-4 font-medium text-gray-900">
                {{ formatPrice(product.price) }}
              </td>

              <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                  :class="product.status === 1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
                  <span class="w-1.5 h-1.5 rounded-full"
                    :class="product.status === 1 ? 'bg-green-500' : 'bg-red-500'"></span>
                  {{ product.status === 1 ? 'Đang bán' : 'Hết hàng' }}
                </span>
              </td>

              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openModal('edit', product)"
                    class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Sửa">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button @click="handleDelete(product)"
                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Phân trang -->
      <div v-if="!isLoading && apiResponse"
        class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <span class="text-xs text-gray-500">
          Hiển thị trang <span class="font-semibold text-gray-900">{{ pageInfo.page }}</span>
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

    <!-- 4. MODAL POPUP (XEM / THÊM / SỬA) -->
    <div v-if="isModalVisible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="closeModal" class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
        
        <!-- Header Modal -->
        <div class="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
          <h3 class="text-lg font-bold text-gray-900">
            {{ modalMode === 'view' ? 'Chi tiết sản phẩm' : modalMode === 'add' ? 'Thêm mới' : 'Cập nhật' }}
          </h3>
          <button @click="closeModal"
            class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="p-6">

          <!-- CHẾ ĐỘ XEM CHI TIẾT -->
          <div v-if="modalMode === 'view'" class="space-y-4">
            <!-- Ảnh -->
            <div v-if="formData.images.length > 0" class="grid gap-2" :class="{
              'grid-cols-1': formData.images.length === 1,
              'grid-cols-2': formData.images.length === 2,
              'grid-cols-3': formData.images.length >= 3
            }">
              <img v-for="(img, idx) in formData.images" :key="idx" :src="img || placeholderImage(formData.name)"
                class="w-full aspect-square object-cover rounded-lg border border-gray-200" @error="handleImageError">
            </div>
            <div v-else class="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <span class="text-gray-400 text-sm">Không có ảnh</span>
            </div>
            
            <!-- Thông tin Text -->
            <div>
              <label class="text-xs font-bold text-gray-400 uppercase">Tên</label>
              <p class="text-lg font-bold text-gray-900">{{ formData.name }}</p>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="text-xs font-bold text-gray-400 uppercase">Giá</label>
                <p class="text-xl font-bold">{{ formatPrice(formData.price) }}</p>
              </div>
              <div>
                 <label class="text-xs font-bold text-gray-400 uppercase">Số lượng</label>
                 <p class="font-medium text-gray-800">{{ formData.quantity }}</p>
              </div>
              <div>
                  <label class="text-xs font-bold text-gray-400 uppercase">Danh mục</label>
                  <p class="font-medium">
                      {{ formData.category_name || categories.find(c => c.id == formData.category_id)?.name || 'Chưa phân loại' }}
                  </p>
              </div>
            </div>

             <!-- Trạng thái -->
             <div>
                <label class="text-xs font-bold text-gray-400 uppercase">Trạng thái</label>
                <div>
                    <span class="inline-block px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                    {{ formData.status === 1 ? 'Đang bán' : 'Hết hàng' }}
                    </span>
                </div>
             </div>

            <div>
              <label class="text-xs font-bold text-gray-400 uppercase">Mô tả</label>
              <div class="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg ql-editor"
                v-html="formData.description || 'Không có'"></div>
            </div>
          </div>

          <!-- FORM NHẬP LIỆU (THÊM / SỬA) -->
          <form v-else @submit.prevent="handleSubmit" class="space-y-5" novalidate>
            
            <!-- TÊN SẢN PHẨM -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tên Sản Phẩm <span
                  class="text-red-500">*</span></label>
              <input 
                v-model="formData.name" 
                type="text" 
                @input="clearError('name')"
                :class="{'border-red-500 focus:border-red-500 focus:ring-red-200': errors.name}"
                class="w-full px-4 py-2 border rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition" 
              />
              <span v-if="errors.name" class="text-red-500 text-xs mt-1 block">{{ errors.name }}</span>
            </div>

            <div class="grid grid-cols-2 gap-5">
              <!-- GIÁ BÁN -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ) <span
                    class="text-red-500">*</span></label>
                <input 
                    v-model.number="formData.price" 
                    type="number" 
                    @input="clearError('price')"
                    :class="{'border-red-500 focus:border-red-500 focus:ring-red-200': errors.price}"
                    class="w-full px-4 py-2 border rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition" 
                />
                <span v-if="errors.price" class="text-red-500 text-xs mt-1 block">{{ errors.price }}</span>
              </div>
              
              <!-- SỐ LƯỢNG -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Số lượng <span
                    class="text-red-500">*</span></label>
                <input 
                    v-model.number="formData.quantity" 
                    type="number" 
                    min="0"
                    @input="clearError('quantity')"
                    :class="{'border-red-500 focus:border-red-500 focus:ring-red-200': errors.quantity}"
                    class="w-full px-4 py-2 border rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition" 
                />
                <span v-if="errors.quantity" class="text-red-500 text-xs mt-1 block">{{ errors.quantity }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-5">
               <!-- SELECT DANH MỤC -->
               <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Danh Mục</label>
                <select 
                    v-model="formData.category_id"
                    @change="clearError('category_id')"
                    :class="{'border-red-500 focus:border-red-500 focus:ring-red-200': errors.category_id}"
                    class="w-full px-4 py-2 border rounded-lg focus:border-black outline-none bg-white transition">
                  <option :value="null">-- Chưa phân loại --</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                      {{ cat.name }}
                  </option>
                </select>
                <span v-if="errors.category_id" class="text-red-500 text-xs mt-1 block">{{ errors.category_id }}</span>
              </div>

               <!-- TRẠNG THÁI -->
               <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label>
                 <select v-model="formData.status"
                   class="w-full px-4 py-2 border rounded-lg focus:border-black outline-none bg-white">
                   <option :value="1">Đang bán</option>
                   <option :value="0">Hết hàng</option>
                 </select>
               </div>
            </div>

            <!-- Upload nhiều ảnh -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Hình Ảnh (Nhiều ảnh)</label>
              <input type="file" ref="fileInput" @change="handleFileUpload" accept="image/*" multiple
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />

              <div v-if="formData.images.length > 0" class="grid grid-cols-4 gap-2 mt-3">
                <div v-for="(img, idx) in formData.images" :key="idx" class="relative group">
                  <img :src="img" class="w-full h-20 object-cover rounded border">
                  <button type="button" @click="removeImage(idx)"
                    class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">
                    ×
                  </button>
                </div>
              </div>
            </div>

            <!-- QUILLE EDITOR -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mô Tả</label>
              <div class="editor-wrapper border rounded-lg overflow-hidden bg-white">
                <QuillEditor theme="snow" v-model:content="formData.description" contentType="html" toolbar="full"
                  placeholder="Nhập mô tả chi tiết sản phẩm..." />
              </div>
            </div>

            <!-- Nút Hành Động -->
            <div class="pt-4 border-t flex justify-end gap-3">
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
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.2s ease-out forwards;
}

:deep(.ql-editor) {
  min-height: 150px;
  font-size: 0.875rem;
  line-height: 1.5;
}

:deep(.ql-toolbar) {
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
  border-bottom: 1px solid #e5e7eb !important;
  background-color: #f9fafb;
}

:deep(.ql-container) {
  border: none !important;
  font-family: inherit;
}

.editor-wrapper {
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.editor-wrapper:focus-within {
  border-color: #000;
  box-shadow: 0 0 0 1px #000;
}
</style>