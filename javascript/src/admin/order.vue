<script setup>
import { ref, computed, onMounted, reactive, onBeforeUnmount, nextTick } from 'vue';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import html2pdf from 'html2pdf.js';

// --- 1. CẤU HÌNH & STATE ---
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

let socket = null;
const isLoading = ref(false);
const orders = ref([]);
const searchQuery = ref("");
const filterStatus = ref("");

// Pagination
const currentPage = ref(1);
const itemsPerPage = 10;

// Modal State
const isModalVisible = ref(false);
const selectedOrder = ref(null);
const isUpdating = ref(false);

// State cho việc in hóa đơn
const invoiceData = ref(null);

// --- 2. DỮ LIỆU GIẢ LẬP ---
const mockOrders = [
    {
        id: 1024,
        customer_name: 'Nguyễn Văn A',
        customer_phone: '0901234567',
        customer_address: '123 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM',
        total_money: 1250000,
        status: 'pending',
        created_at: '2023-10-25T08:30:00Z',
        items: [
            { product_name: 'Áo Thun Basic (Đen)', quantity: 2, price: 250000, image: 'https://placehold.co/50x50' },
            { product_name: 'Quần Jeans Slim Fit', quantity: 1, price: 750000, image: 'https://placehold.co/50x50' }
        ]
    },
    {
        id: 1023,
        customer_name: 'Trần Thị B',
        customer_phone: '0918765432',
        customer_address: '456 Lê Lợi, Đà Nẵng',
        total_money: 500000,
        status: 'shipping',
        created_at: '2023-10-24T14:15:00Z',
        items: [
            { product_name: 'Váy Hoa Nhí Vintage', quantity: 1, price: 500000, image: 'https://placehold.co/50x50' }
        ]
    },
    {
        id: 1022,
        customer_name: 'Lê Văn C',
        customer_phone: '0988888888',
        customer_address: '789 Cầu Giấy, Hà Nội',
        total_money: 2000000,
        status: 'completed',
        created_at: '2023-10-20T09:00:00Z',
        items: []
    },
    {
        id: 1021,
        customer_name: 'Phạm Văn D',
        customer_phone: '0977777777',
        customer_address: '12 Hùng Vương, Cần Thơ',
        total_money: 350000,
        status: 'cancelled',
        created_at: '2023-10-19T10:00:00Z',
        items: []
    }
];

// --- 3. HELPER FUNCTIONS ---
const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date);
};

const getStatusBadge = (status) => {
    switch (status) {
        case 'pending': return { text: 'Chờ xử lý', class: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' };
        case 'shipping': return { text: 'Đang giao', class: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
        case 'completed': return { text: 'Hoàn thành', class: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' };
        case 'cancelled': return { text: 'Đã hủy', class: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' };
        default: return { text: 'Không rõ', class: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-500' };
    }
};

// --- 4. LOGIC CHÍNH ---

const fetchOrders = async () => {
    isLoading.value = true;
    try {
        setTimeout(() => {
            orders.value = mockOrders;
            isLoading.value = false;
        }, 500);
    } catch (error) {
        console.error(error);
        isLoading.value = false;
    }
};

const filteredOrders = computed(() => {
    let data = orders.value;
    if (searchQuery.value) {
        const lower = searchQuery.value.toLowerCase();
        data = data.filter(o =>
            o.customer_name.toLowerCase().includes(lower) ||
            o.customer_phone.includes(lower) ||
            o.id.toString().includes(lower)
        );
    }
    if (filterStatus.value) {
        data = data.filter(o => o.status === filterStatus.value);
    }
    return data;
});

const paginatedOrders = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredOrders.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / itemsPerPage));
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };

const openDetailModal = (order) => {
    selectedOrder.value = JSON.parse(JSON.stringify(order));
    isModalVisible.value = true;
    document.body.style.overflow = "hidden";
};

const closeModal = () => {
    isModalVisible.value = false;
    selectedOrder.value = null;
    document.body.style.overflow = "";
};

const updateOrderStatus = async (newStatus) => {
    if (!selectedOrder.value) return;
    isUpdating.value = true;
    try {
        await new Promise(r => setTimeout(r, 600));
        const index = orders.value.findIndex(o => o.id === selectedOrder.value.id);
        if (index !== -1) {
            orders.value[index].status = newStatus;
        }
        selectedOrder.value.status = newStatus;
        Toast.fire({ icon: 'success', title: 'Cập nhật trạng thái thành công!' });
    } catch (e) {
        Toast.fire({ icon: 'error', title: 'Có lỗi xảy ra!' });
    } finally {
        isUpdating.value = false;
    }
};

// --- IN HÓA ĐƠN VỚI HTML2PDF ---
const printOrderInvoice = async (order) => {
    invoiceData.value = order;

    Swal.fire({
        title: 'Đang tạo hóa đơn...',
        text: 'Vui lòng đợi...',
        didOpen: () => Swal.showLoading()
    });

    await nextTick();

    const element = document.getElementById('invoice-template');

    // FIX LỖI LẸM:
    // Vì template đã set w-[794px] (chuẩn A4) và có padding p-10
    // Nên ta phải set margin = 0 để html2pdf in toàn bộ div đó ra giấy mà không chèn thêm lề trắng
    const opt = {
        margin: 0, // QUAN TRỌNG: Set về 0 để tránh bị đẩy nội dung
        filename: `Hoa_Don_${order.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            // Thêm windowWidth để đảm bảo render đúng kích thước dù màn hình nhỏ
            windowWidth: 800,
            width: 794 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
        Swal.close();
        Toast.fire({ icon: 'success', title: 'Đã tải hóa đơn!' });
    } catch (error) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Lỗi in hóa đơn', text: error.message });
    }
};

// --- LIFECYCLE ---
onMounted(() => {
    fetchOrders();
    // Socket logic commented out for demo stability
    // socket = io("http://localhost:8080");
    // socket.on("NEW_ORDER", (data) => { ... });
});

onBeforeUnmount(() => {
    if (socket) socket.disconnect();
});
</script>

<template>
    <div>

        <!-- HEADER -->
        <div class="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-6 gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Đơn Hàng</h1>
                <p class="text-sm text-gray-500 mt-1">Theo dõi và xử lý các đơn đặt hàng từ khách.</p>
            </div>
        </div>

        <!-- FILTER -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div class="flex flex-col md:flex-row gap-4">
                <div class="flex-1 relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><i
                            class="fa-solid fa-magnifying-glass"></i></span>
                    <input v-model="searchQuery" type="text"
                        class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        placeholder="Tìm theo Mã đơn, Tên khách hoặc SĐT..." />
                </div>
                <div class="w-full md:w-64 relative">
                    <select v-model="filterStatus"
                        class="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm appearance-none cursor-pointer">
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="shipping">Đang giao hàng</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><i
                            class="fa-solid fa-chevron-down text-xs"></i></span>
                </div>
            </div>
        </div>

        <!-- DATA TABLE -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full whitespace-nowrap text-left text-sm">
                    <thead class="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th class="px-6 py-4">Mã đơn</th>
                            <th class="px-6 py-4">Khách hàng</th>
                            <th class="px-6 py-4">Ngày đặt</th>
                            <th class="px-6 py-4">Tổng tiền</th>
                            <th class="px-6 py-4">Trạng thái</th>
                            <th class="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr v-if="isLoading">
                            <td colspan="6" class="px-6 py-10 text-center text-gray-400"><i
                                    class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i>
                                <p>Đang tải...</p>
                            </td>
                        </tr>
                        <tr v-else-if="paginatedOrders.length === 0">
                            <td colspan="6" class="px-6 py-10 text-center text-gray-400">
                                <p>Không tìm thấy đơn hàng nào.</p>
                            </td>
                        </tr>
                        <tr v-else v-for="order in paginatedOrders" :key="order.id" class="hover:bg-gray-50 transition">
                            <td class="px-6 py-4 font-bold text-gray-900">#{{ order.id }}</td>
                            <td class="px-6 py-4">
                                <div class="flex flex-col">
                                    <span class="font-semibold text-gray-900">{{ order.customer_name }}</span>
                                    <span class="text-xs text-gray-500">{{ order.customer_phone }}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-gray-600">{{ formatDate(order.created_at) }}</td>
                            <td class="px-6 py-4 font-bold text-gray-900">{{ formatPrice(order.total_money) }}</td>
                            <td class="px-6 py-4">
                                <span
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                                    :class="getStatusBadge(order.status).class">
                                    <span class="w-1.5 h-1.5 rounded-full"
                                        :class="getStatusBadge(order.status).dot"></span>
                                    {{ getStatusBadge(order.status).text }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex justify-end gap-2">
                                    <button @click.stop="printOrderInvoice(order)"
                                        class="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                                        title="In hóa đơn"><i class="fa-solid fa-print"></i></button>
                                    <button @click="openDetailModal(order)"
                                        class="text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-lg transition"
                                        title="Xem chi tiết"><i class="fa-solid fa-eye"></i></button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- Pagination -->
            <div v-if="!isLoading && paginatedOrders.length > 0"
                class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <span class="text-xs text-gray-500">Trang <span class="font-semibold text-gray-900">{{ currentPage
                        }}</span> / {{ totalPages }}</span>
                <div class="flex gap-2">
                    <button @click="prevPage" :disabled="currentPage <= 1"
                        class="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Trước</button>
                    <button @click="nextPage" :disabled="currentPage >= totalPages"
                        class="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Sau</button>
                </div>
            </div>
        </div>

        <!-- MODAL DETAIL -->
        <div v-if="isModalVisible && selectedOrder" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div @click="closeModal" class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
            <div
                class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in-up flex flex-col">
                <div
                    class="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">Chi tiết đơn hàng #{{ selectedOrder.id }}</h3>
                        <p class="text-xs text-gray-500">{{ formatDate(selectedOrder.created_at) }}</p>
                    </div>
                    <div class="flex gap-2">
                        <button @click="printOrderInvoice(selectedOrder)"
                            class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium flex items-center gap-2">
                            <i class="fa-solid fa-print"></i> In Hóa Đơn
                        </button>
                        <button @click="closeModal"
                            class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>
                <div class="p-6 space-y-6">
                    <!-- Info Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 class="text-xs font-bold text-gray-400 uppercase mb-3">Khách hàng</h4>
                            <div class="space-y-2 text-sm">
                                <p><span class="text-gray-500">Họ tên:</span> <span class="font-medium text-gray-900">{{
                                        selectedOrder.customer_name }}</span></p>
                                <p><span class="text-gray-500">SĐT:</span> <span class="font-medium text-gray-900">{{
                                        selectedOrder.customer_phone }}</span></p>
                            </div>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 class="text-xs font-bold text-gray-400 uppercase mb-3">Giao nhận</h4>
                            <div class="space-y-2 text-sm">
                                <p><span class="text-gray-500">Địa chỉ:</span> <span
                                        class="font-medium text-gray-900">{{ selectedOrder.customer_address }}</span>
                                </p>
                                <p><span class="text-gray-500">Thanh toán:</span> <span
                                        class="font-medium text-gray-900">COD</span></p>
                            </div>
                        </div>
                    </div>
                    <!-- Items Table -->
                    <div>
                        <h4 class="text-xs font-bold text-gray-400 uppercase mb-3">Sản phẩm</h4>
                        <div class="border border-gray-200 rounded-lg overflow-hidden">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th class="px-4 py-3">Sản phẩm</th>
                                        <th class="px-4 py-3 text-center">SL</th>
                                        <th class="px-4 py-3 text-right">Đơn giá</th>
                                        <th class="px-4 py-3 text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100">
                                    <tr v-for="(item, idx) in selectedOrder.items" :key="idx">
                                        <td class="px-4 py-3 flex items-center gap-3">
                                            <img :src="item.image" class="w-10 h-10 rounded border object-cover">
                                            <span class="font-medium text-gray-900">{{ item.product_name }}</span>
                                        </td>
                                        <td class="px-4 py-3 text-center">{{ item.quantity }}</td>
                                        <td class="px-4 py-3 text-right">{{ formatPrice(item.price) }}</td>
                                        <td class="px-4 py-3 text-right font-bold">{{ formatPrice(item.price *
                                            item.quantity) }}</td>
                                    </tr>
                                </tbody>
                                <tfoot class="bg-gray-50 font-bold text-gray-900">
                                    <tr>
                                        <td colspan="3" class="px-4 py-3 text-right">Tổng cộng:</td>
                                        <td class="px-4 py-3 text-right text-base">{{
                                            formatPrice(selectedOrder.total_money) }}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    <!-- Actions -->
                    <div class="border-t border-gray-100 pt-6">
                        <h4 class="text-xs font-bold text-gray-400 uppercase mb-3">Xử lý đơn hàng</h4>
                        <div class="flex flex-wrap gap-3">
                            <button v-if="selectedOrder.status === 'pending'" @click="updateOrderStatus('shipping')"
                                :disabled="isUpdating"
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm flex items-center gap-2"><i
                                    class="fa-solid fa-truck-fast"></i> Xác nhận giao hàng</button>
                            <button v-if="selectedOrder.status === 'shipping'" @click="updateOrderStatus('completed')"
                                :disabled="isUpdating"
                                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm flex items-center gap-2"><i
                                    class="fa-solid fa-check"></i> Hoàn thành đơn</button>
                            <button v-if="['pending', 'shipping'].includes(selectedOrder.status)"
                                @click="updateOrderStatus('cancelled')" :disabled="isUpdating"
                                class="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50 text-sm flex items-center gap-2"><i
                                    class="fa-solid fa-ban"></i> Hủy đơn hàng</button>
                            <span v-if="['completed', 'cancelled'].includes(selectedOrder.status)"
                                class="text-sm text-gray-500 italic">Đơn hàng đã kết thúc quy trình.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ============================================== -->
        <!-- TEMPLATE HÓA ĐƠN ẨN (Dùng để in PDF)           -->
        <!-- ============================================== -->
        <div v-if="invoiceData" class="absolute left-[-9999px] top-0 pointer-events-none">
            <!-- W-[794px] đã chuẩn A4 96dpi. Kết hợp margin:0 trong config sẽ full trang -->
            <div id="invoice-template" class="bg-white p-10 w-[794px] text-gray-900 leading-normal"
                style="font-family: Arial, Helvetica, sans-serif;">

                <!-- 1. Header -->
                <div class="flex justify-between items-start mb-8 pb-8 border-b-2 border-gray-800">
                    <div>
                        <h1 class="text-4xl font-black tracking-tight mb-2">BW FASHION</h1>
                        <p class="text-sm text-gray-600">123 Đường ABC, Quận 1, TP.HCM</p>
                        <p class="text-sm text-gray-600">Hotline: 0909.888.999</p>
                    </div>
                    <div class="text-right">
                        <h2 class="text-3xl font-bold text-gray-800 uppercase mb-2">Hóa Đơn</h2>
                        <p class="text-sm text-gray-600">Mã đơn: <span class="font-bold text-black">#{{ invoiceData.id
                                }}</span></p>
                        <p class="text-sm text-gray-600">Ngày đặt: {{ formatDate(invoiceData.created_at) }}</p>
                    </div>
                </div>

                <!-- 2. Thông tin khách hàng -->
                <div class="flex justify-between mb-10">
                    <div class="w-1/2 pr-6">
                        <h3
                            class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">
                            Khách Hàng</h3>
                        <p class="font-bold text-lg mb-1">{{ invoiceData.customer_name }}</p>
                        <p class="text-sm text-gray-600 mb-1">{{ invoiceData.customer_phone }}</p>
                        <p class="text-sm text-gray-600">{{ invoiceData.customer_address }}</p>
                    </div>
                    <div class="w-1/2 pl-6">
                        <h3
                            class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">
                            Giao Dịch</h3>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-600">Phương thức:</span>
                            <span class="font-medium">COD</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Trạng thái:</span>
                            <span class="font-medium capitalize">{{ invoiceData.status }}</span>
                        </div>
                    </div>
                </div>

                <!-- 3. Bảng Sản Phẩm -->
                <div class="mb-8">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-black text-white text-sm uppercase tracking-wide">
                                <th class="py-3 px-4 font-bold">Sản phẩm</th>
                                <th class="py-3 px-4 text-center font-bold">Đơn giá</th>
                                <th class="py-3 px-4 text-center font-bold">SL</th>
                                <th class="py-3 px-4 text-right font-bold">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm">
                            <tr v-for="(item, idx) in invoiceData.items" :key="idx" class="border-b border-gray-100">
                                <td class="py-4 px-4 font-medium">{{ item.product_name }}</td>
                                <td class="py-4 px-4 text-center text-gray-600">{{ formatPrice(item.price) }}</td>
                                <td class="py-4 px-4 text-center font-bold">{{ item.quantity }}</td>
                                <td class="py-4 px-4 text-right font-bold">{{ formatPrice(item.price * item.quantity) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 4. Tổng Tiền (Căn chỉnh theo cột Thành Tiền) -->
                <div class="flex justify-end pt-4 mb-12">
                    <div class="w-1/2"> <!-- Chiếm 50% bên phải -->
                        <div class="flex justify-between mb-2 text-sm px-4">
                            <span class="text-gray-600">Tạm tính:</span>
                            <span class="font-medium">{{ formatPrice(invoiceData.total_money) }}</span>
                        </div>
                        <div class="flex justify-between mb-4 text-sm px-4">
                            <span class="text-gray-600">Phí vận chuyển:</span>
                            <span class="font-medium">0 ₫</span>
                        </div>
                        <!-- Tổng cộng: Dùng font bold giống header bảng -->
                        <div
                            class="flex justify-between items-center text-xl bg-gray-50 p-4 rounded font-bold border-t-2 border-black">
                            <span>TỔNG CỘNG:</span>
                            <span class="text-red-600">{{ formatPrice(invoiceData.total_money) }}</span>
                        </div>
                    </div>
                </div>

                <!-- 5. Footer -->
                <div class="text-center text-sm text-gray-500 mt-auto pt-10 border-t border-gray-100">
                    <p class="font-medium text-black mb-1">Cảm ơn quý khách đã mua sắm tại BW Fashion!</p>
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