<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import html2pdf from 'html2pdf.js';

// 1. Config & State
const Toast = Swal.mixin({
    toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true,
    didOpen: (t) => { t.onmouseenter = Swal.stopTimer; t.onmouseleave = Swal.resumeTimer; }
});

let socket = null;
const isLoading = ref(false);
const orders = ref([]);
const searchQuery = ref("");
const filterStatus = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;
const totalPages = ref(1);
const isModalVisible = ref(false);
const selectedOrder = ref(null);
const isUpdating = ref(false);
const invoiceData = ref(null);

// 2. Helpers
const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
const formatDate = (d) => d ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d)) : "";

const getStatusBadge = (s) => {
    const map = {
        'pending': { text: 'Chờ xử lý', class: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
        'shipping': { text: 'Đang giao', class: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
        'completed': { text: 'Hoàn thành', class: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
        'cancelled': { text: 'Đã hủy', class: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' }
    };
    return map[s] || { text: 'Khác', class: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-500' };
};

// 3. Logic API
const fetchOrders = async () => {
    isLoading.value = true;
    try {
        // Gửi search và status lên server
        const params = new URLSearchParams({ 
            page: currentPage.value, 
            limit: itemsPerPage, 
            search: searchQuery.value, 
            status: filterStatus.value 
        });
        
        const res = await fetch(`/api/orders?${params}`);
        const data = await res.json();
        
        if (res.ok) { 
            orders.value = data.data; 
            totalPages.value = data.totalPages; 
        } else { 
            console.error(data.error); 
            orders.value = []; 
        }
    } catch (e) { 
        Toast.fire({ icon: 'error', title: 'Lỗi kết nối!' }); 
    } finally { 
        isLoading.value = false; 
    }
};

// 4. Xử lý Watchers (Tìm kiếm & Lọc)

// Khi đổi trang -> Gọi API
watch(currentPage, fetchOrders);

// Khi đổi bộ lọc Status -> Reset về trang 1
watch(filterStatus, () => {
    if (currentPage.value === 1) fetchOrders();
    else currentPage.value = 1;
});

// Khi tìm kiếm -> Debounce 0.5s -> Reset về trang 1
let searchTimeout;
watch(searchQuery, () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        if (currentPage.value === 1) fetchOrders();
        else currentPage.value = 1;
    }, 500);
});

// Pagination & Modal
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const openDetailModal = (o) => { selectedOrder.value = JSON.parse(JSON.stringify(o)); isModalVisible.value = true; document.body.style.overflow = "hidden"; };
const closeModal = () => { isModalVisible.value = false; selectedOrder.value = null; document.body.style.overflow = ""; };

// Update Status
const updateOrderStatus = async (status) => {
    if (!selectedOrder.value) return;
    isUpdating.value = true;
    try {
        const res = await fetch(`/api/orders/${selectedOrder.value.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
        });
        if (res.ok) {
            const idx = orders.value.findIndex(o => o.id === selectedOrder.value.id);
            if (idx !== -1) orders.value[idx].status = status;
            selectedOrder.value.status = status;
            Toast.fire({ icon: 'success', title: 'Đã cập nhật!' });
        } else Toast.fire({ icon: 'error', title: 'Lỗi!' });
    } catch (e) { Toast.fire({ icon: 'error', title: 'Lỗi kết nối!' }); }
    finally { isUpdating.value = false; }
};

// 5. Print PDF
const printOrderInvoice = async (order) => {
    invoiceData.value = order;
    Swal.fire({ title: 'Đang tạo PDF...', didOpen: () => Swal.showLoading() });
    await nextTick();
    const element = document.getElementById('invoice-template');
    await html2pdf().set({ margin: 0, filename: `HD_${order.id}.pdf`, html2canvas: { scale: 2, windowWidth: 800, width: 794 }, jsPDF: { unit: 'mm', format: 'a4' } }).from(element).save();
    Swal.close();
};

// 6. Lifecycle & Socket
onMounted(() => {
    fetchOrders();
    socket = io();
    socket.on("NEW_ORDER", (d) => { Toast.fire({ icon: 'info', title: `Đơn mới #${d.orderId}` }); fetchOrders(); });
    socket.on("ORDER_UPDATED", (d) => {
        const idx = orders.value.findIndex(o => o.id == d.id);
        if (idx !== -1) orders.value[idx].status = d.status;
        if (selectedOrder.value?.id == d.id) selectedOrder.value.status = d.status;
    });
});
onBeforeUnmount(() => socket?.disconnect());
</script>

<template>
    <div>
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">Quản lý Đơn Hàng</h1>
        </div>

        <!-- Filter Form -->
        <div class="bg-white p-4 rounded-xl border mb-6 flex flex-col md:flex-row gap-4">
            <div class="flex-1 relative">
                <input v-model="searchQuery" class="w-full p-2 border rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none" placeholder="Tìm theo Tên, SĐT hoặc Mã đơn..." />
            </div>
            <div class="relative w-full md:w-64">
                <select v-model="filterStatus" class="w-full p-2 border rounded-lg text-sm appearance-none cursor-pointer focus:border-black focus:ring-1 focus:ring-black outline-none bg-white">
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="shipping">Đang giao</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                </select>
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><i class="fa-solid fa-chevron-down text-xs"></i></span>
            </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-xl border overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                    <thead class="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th class="p-4">Mã</th><th class="p-4">Khách</th><th class="p-4">Ngày</th>
                            <th class="p-4">Tiền</th><th class="p-4">Trạng thái</th><th class="p-4 text-right">#</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="isLoading"><td colspan="6" class="p-10 text-center text-gray-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i><p>Đang tải...</p></td></tr>
                        <tr v-else-if="!orders.length"><td colspan="6" class="p-10 text-center text-gray-400"><p>Không tìm thấy đơn hàng nào.</p></td></tr>
                        <tr v-else v-for="o in orders" :key="o.id" class="hover:bg-gray-50 border-t transition">
                            <td class="p-4 font-bold text-gray-900">#{{ o.id }}</td>
                            <td class="p-4">
                                <div class="font-semibold text-gray-900">{{ o.customer_name }}</div>
                                <div class="text-xs text-gray-500">{{ o.customer_phone }}</div>
                            </td>
                            <td class="p-4 text-gray-600">{{ formatDate(o.created_at) }}</td>
                            <td class="p-4 font-bold text-gray-900">{{ formatPrice(o.total_money) }}</td>
                            <td class="p-4">
                                <span class="px-2.5 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1.5" :class="getStatusBadge(o.status).class">
                                    <span class="w-1.5 h-1.5 rounded-full" :class="getStatusBadge(o.status).dot"></span>
                                    {{ getStatusBadge(o.status).text }}
                                </span>
                            </td>
                            <td class="p-4 text-right">
                                <button @click.stop="printOrderInvoice(o)" class="p-2 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition" title="In"><i class="fa-solid fa-print"></i></button>
                                <button @click="openDetailModal(o)" class="p-2 text-gray-400 hover:text-black rounded hover:bg-gray-100 transition" title="Xem"><i class="fa-solid fa-eye"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <!-- Pagination -->
            <div v-if="!isLoading && orders.length" class="p-4 border-t flex justify-between items-center bg-gray-50">
                <span class="text-xs text-gray-500">Trang <span class="font-semibold text-gray-900">{{ currentPage }}</span> / {{ totalPages }}</span>
                <div class="flex gap-2">
                    <button @click="prevPage" :disabled="currentPage <= 1" class="px-3 py-1.5 bg-white border rounded text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition">Trước</button>
                    <button @click="nextPage" :disabled="currentPage >= totalPages" class="px-3 py-1.5 bg-white border rounded text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition">Sau</button>
                </div>
            </div>
        </div>

        <!-- Modal -->
        <div v-if="isModalVisible && selectedOrder" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div @click="closeModal" class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
            <div class="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in-up flex flex-col shadow-2xl">
                <div class="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
                    <h3 class="font-bold text-lg">Đơn hàng #{{ selectedOrder.id }}</h3>
                    <div class="flex gap-2">
                        <button @click="printOrderInvoice(selectedOrder)" class="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center gap-2"><i class="fa-solid fa-print"></i> In Hóa Đơn</button>
                        <button @click="closeModal" class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500 hover:text-black transition"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <div class="p-6 space-y-6">
                    <div class="grid md:grid-cols-2 gap-6 text-sm">
                        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 class="font-bold text-gray-400 uppercase text-xs mb-3">KHÁCH HÀNG</h4>
                            <p class="mb-1"><span class="text-gray-500">Tên:</span> <span class="font-medium">{{ selectedOrder.customer_name }}</span></p>
                            <p><span class="text-gray-500">SĐT:</span> <span class="font-medium">{{ selectedOrder.customer_phone }}</span></p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 class="font-bold text-gray-400 uppercase text-xs mb-3">GIAO NHẬN</h4>
                            <p class="mb-1"><span class="text-gray-500">Địa chỉ:</span> <span class="font-medium">{{ selectedOrder.customer_address }}</span></p>
                            <p><span class="text-gray-500">Thanh toán:</span> <b>COD</b></p>
                        </div>
                    </div>
                    <div class="border rounded-lg overflow-hidden">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50 border-b text-gray-500 font-medium">
                                <tr><th class="p-3 text-left">Sản phẩm</th><th class="p-3 text-center">SL</th><th class="p-3 text-right">Thành tiền</th></tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                <tr v-for="(item, i) in selectedOrder.items" :key="i">
                                    <td class="p-3 flex items-center gap-3">
                                        <img :src="item.image" class="w-10 h-10 rounded border object-cover" onerror="this.src='https://placehold.co/50x50'">
                                        <span class="font-medium text-gray-900">{{ item.product_name }}</span>
                                    </td>
                                    <td class="p-3 text-center">{{ item.quantity }}</td>
                                    <td class="p-3 text-right font-bold">{{ formatPrice(item.price * item.quantity) }}</td>
                                </tr>
                            </tbody>
                            <tfoot class="bg-gray-50 font-bold text-gray-900">
                                <tr><td colspan="2" class="p-3 text-right">Tổng cộng:</td><td class="p-3 text-right text-base">{{ formatPrice(selectedOrder.total_money) }}</td></tr>
                            </tfoot>
                        </table>
                    </div>
                    <div class="pt-6 border-t flex flex-wrap gap-3">
                        <button v-if="selectedOrder.status === 'pending'" @click="updateOrderStatus('shipping')" :disabled="isUpdating" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm flex items-center gap-2"><i class="fa-solid fa-truck-fast"></i> Giao hàng</button>
                        <button v-if="selectedOrder.status === 'shipping'" @click="updateOrderStatus('completed')" :disabled="isUpdating" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm flex items-center gap-2"><i class="fa-solid fa-check"></i> Hoàn thành</button>
                        <button v-if="['pending', 'shipping'].includes(selectedOrder.status)" @click="updateOrderStatus('cancelled')" :disabled="isUpdating" class="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50 text-sm flex items-center gap-2"><i class="fa-solid fa-ban"></i> Hủy đơn</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hidden Invoice Template -->
        <div v-if="invoiceData" class="absolute left-[-9999px] top-0">
            <div id="invoice-template" class="bg-white p-10 w-[794px] text-gray-900 leading-normal" style="font-family: Arial, Helvetica, sans-serif;">
                <div class="flex justify-between border-b-2 border-black pb-4 mb-6">
                    <div><h1 class="text-3xl font-black tracking-tight">BW FASHION</h1><p class="text-sm text-gray-600">123 Đường ABC, Quận 1, TP.HCM</p></div>
                    <div class="text-right"><h2 class="text-2xl font-bold uppercase">HÓA ĐƠN</h2><p class="text-sm">#{{ invoiceData.id }}</p><p class="text-sm">{{ formatDate(invoiceData.created_at) }}</p></div>
                </div>
                <div class="mb-8 flex justify-between">
                    <div><h4 class="font-bold text-xs uppercase text-gray-400 mb-1">KHÁCH HÀNG</h4><p class="font-bold">{{ invoiceData.customer_name }}</p><p class="text-sm text-gray-600">{{ invoiceData.customer_phone }}</p><p class="text-sm text-gray-600">{{ invoiceData.customer_address }}</p></div>
                    <div class="text-right"><h4 class="font-bold text-xs uppercase text-gray-400 mb-1">THANH TOÁN</h4><p class="font-bold">COD</p><p class="text-sm capitalize">{{ invoiceData.status }}</p></div>
                </div>
                <table class="w-full border-collapse mb-8 text-sm">
                    <thead class="bg-black text-white uppercase text-xs"><tr><th class="p-3 text-left">Sản phẩm</th><th class="p-3 text-center">SL</th><th class="p-3 text-right">Thành tiền</th></tr></thead>
                    <tbody>
                        <tr v-for="(item, i) in invoiceData.items" :key="i" class="border-b border-gray-100"><td class="p-3 font-medium">{{ item.product_name }}</td><td class="p-3 text-center">{{ item.quantity }}</td><td class="p-3 text-right font-bold">{{ formatPrice(item.price * item.quantity) }}</td></tr>
                    </tbody>
                </table>
                <div class="flex justify-end"><div class="w-1/2 border-t-2 border-black pt-4"><div class="flex justify-between text-xl font-bold"><span>TỔNG CỘNG:</span><span>{{ formatPrice(invoiceData.total_money) }}</span></div></div></div>
                <div class="text-center mt-12 text-sm text-gray-500 pt-8 border-t border-gray-100">Cảm ơn quý khách đã mua sắm tại BW Fashion!</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-fade-in-up { animation: fadeInUp 0.2s ease-out forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>