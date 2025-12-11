<script setup>
// --- 1. IMPORT THƯ VIỆN ---
import { ref, computed, onMounted, reactive, onBeforeUnmount } from 'vue';
import { io } from 'socket.io-client';
import Swal from 'sweetalert2';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

// --- 2. CẤU HÌNH TOAST ---
const Toast = Swal.mixin({
  toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true,
  didOpen: (toast) => { toast.onmouseenter = Swal.stopTimer; toast.onmouseleave = Swal.resumeTimer; }
});

// --- 3. STATE ---
let socket = null;
const apiResponse = ref(null);
const isLoading = ref(false);
const isSubmitting = ref(false);
const currentPage = ref(1);
const searchQuery = ref("");
const filterStatus = ref("");
const categories = ref([]); 
const fileInput = ref(null);
const isModalVisible = ref(false);
const modalMode = ref('view');

const formData = reactive({
  id: null, name: '', price: 0, quantity: 0, description: '', category_id: null, 
  images: [], imageFiles: [], status: 1
});

const errors = reactive({ name: '', price: '', quantity: '', category_id: '' });

// --- 4. HELPER ---
const stripHtml = (html) => {
  if (!html) return "Chưa có mô tả";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, ' ').trim().substring(0, 60) + "...";
};

const formatPrice = (price) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const placeholderImage = (name = "IMG") => `https://placehold.co/100x100/f3f4f6/9ca3af?text=${encodeURI((name || "SP").substring(0, 3).toUpperCase())}`;
const handleImageError = (e) => { if (e.target.src !== placeholderImage("ERR")) e.target.src = placeholderImage("ERR"); };

// --- 5. VALIDATION ---
const validateForm = () => {
  let isValid = true;
  errors.name = ''; errors.price = ''; errors.quantity = ''; errors.category_id = '';

  if (!formData.name?.trim()) { errors.name = 'Tên không được để trống.'; isValid = false; }
  if (formData.price === '' || isNaN(formData.price) || formData.price < 0) { errors.price = 'Giá không hợp lệ.'; isValid = false; }
  if (formData.quantity === '' || isNaN(formData.quantity) || formData.quantity < 0) { errors.quantity = 'Số lượng không hợp lệ.'; isValid = false; }
  if (!formData.category_id) { errors.category_id = 'Chọn danh mục.'; isValid = false; }
  return isValid;
};
const clearError = (f) => { if (errors[f]) errors[f] = ''; };

// --- 6. COMPUTED ---
const products = computed(() => {
  let data = apiResponse.value?.data || [];
  if (searchQuery.value) data = data.filter(p => p.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
  if (filterStatus.value !== "") data = data.filter(p => p.status === parseInt(filterStatus.value));
  return data;
});

const pageInfo = computed(() => {
  if (!apiResponse.value) return { page: 1, limit: 10, hasMore: false, total: 0 };
  return { page: apiResponse.value.page, limit: apiResponse.value.limit, hasMore: apiResponse.value.data.length === apiResponse.value.limit, total: apiResponse.value.total || 'N/A' };
});

// --- 7. METHODS ---
const fetchCategories = async () => {
    try { const res = await fetch('/api/categories-all'); if(res.ok) categories.value = await res.json(); } catch (e) { console.error(e); }
};

const handleFileUpload = (event) => {
  Array.from(event.target.files).forEach(file => {
    if (!file.type.startsWith('image/')) return Toast.fire({ icon: 'error', title: 'Chỉ chấp nhận file ảnh!' });
    formData.imageFiles.push(file);
    formData.images.push(URL.createObjectURL(file));
  });
};
const removeImage = (i) => { formData.images.splice(i, 1); formData.imageFiles.splice(i, 1); };

const fetchData = async (page) => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    const res = await fetch(`/api/home?page=${page}`);
    if (!res.ok) throw new Error();
    apiResponse.value = await res.json();
    currentPage.value = apiResponse.value.page;
  } catch (e) { Toast.fire({ icon: 'error', title: 'Lỗi tải dữ liệu!' }); } 
  finally { isLoading.value = false; }
};

const prevPage = () => { if (pageInfo.value.page > 1) fetchData(pageInfo.value.page - 1); };
const nextPage = () => { if (pageInfo.value.hasMore) fetchData(pageInfo.value.page + 1); };

const openModal = (mode, product = null) => {
  modalMode.value = mode;
  if (fileInput.value) fileInput.value.value = null;
  Object.keys(errors).forEach(k => errors[k] = '');

  if (mode === 'add') {
    Object.assign(formData, { id: null, name: '', price: 0, quantity: 0, description: '', category_id: null, images: [], imageFiles: [], status: 1 });
  } else if (product) {
    const imgs = product.image ? product.image.split(",") : [];
    // Spread operator (...) sẽ sao chép cả count_sold vào formData
    Object.assign(formData, { ...product, category_id: product.category_id, quantity: product.quantity || 0, images: imgs, imageFiles: [] });
    if (!formData.description) formData.description = '';
  }
  isModalVisible.value = true;
  document.body.style.overflow = "hidden";
};

const closeModal = () => { isModalVisible.value = false; document.body.style.overflow = ""; };

const handleSubmit = async () => {
  if (!validateForm() || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const url = modalMode.value === 'add' ? '/api/products' : `/api/products/${formData.id}`;
    const method = modalMode.value === 'add' ? 'POST' : 'PUT';
    const payload = new FormData();
    ['name', 'price', 'quantity', 'description', 'status', 'category_id'].forEach(k => payload.append(k, formData[k] || (k==='category_id'?'null':'')));
    
    if (formData.imageFiles.length > 0) {
      formData.imageFiles.forEach(file => payload.append('images', file));
      payload.append('keepOldImages', 'false');
    } else payload.append('keepOldImages', 'true');

    const res = await fetch(url, { method, body: payload });
    if (!res.ok) throw new Error();
    
    closeModal();
    Toast.fire({ icon: 'success', title: 'Thành công!' });
  } catch (e) { Swal.fire('Lỗi', 'Không thể lưu sản phẩm', 'error'); } 
  finally { isSubmitting.value = false; }
};

const handleDelete = async (product) => {
  const result = await Swal.fire({ title: 'Xóa sản phẩm?', text: product.name, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
  if (!result.isConfirmed) return;
  try {
    const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    Toast.fire({ icon: 'success', title: 'Đã xóa!' });
  } catch (e) { Swal.fire('Lỗi', 'Không thể xóa', 'error'); }
};

onMounted(() => {
  fetchData(currentPage.value);
  fetchCategories();
  socket = io("http://localhost:8080");
  socket.on("REFRESH_DATA", () => fetchData(currentPage.value));
});
onBeforeUnmount(() => socket && socket.disconnect());
</script>

<template>
  <div>
    <!-- HEADER -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Danh sách sản phẩm</h1>
        <p class="text-sm text-gray-500 mt-1">Quản lý kho hàng và thông tin sản phẩm.</p>
      </div>
      <button @click="openModal('add')" class="bg-black text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition shadow-sm flex items-center gap-2">
        <i class="fa-solid fa-plus"></i> Thêm mới
      </button>
    </div>

    <!-- FILTER -->
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><i class="fa-solid fa-magnifying-glass"></i></span>
          <input v-model="searchQuery" type="text" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition text-sm" placeholder="Tìm kiếm theo tên sản phẩm..." />
        </div>
        <div class="w-full md:w-64 relative">
          <select v-model="filterStatus" class="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-black outline-none appearance-none text-sm cursor-pointer">
            <option value="">Tất cả trạng thái</option>
            <option value="1">Đang bán</option>
            <option value="0">Hết hàng</option>
          </select>
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><i class="fa-solid fa-chevron-down text-xs"></i></span>
        </div>
      </div>
    </div>

    <!-- TABLE -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full whitespace-nowrap text-left text-sm">
          <thead class="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th class="px-6 py-4">Sản phẩm</th>
              <th class="px-6 py-4">Danh mục</th>
              <th class="px-6 py-4 text-center">Kho</th>
              <th class="px-6 py-4 text-center">Đã bán</th> <!-- Thêm cột này -->
              <th class="px-6 py-4">Giá bán</th>
              <th class="px-6 py-4">Trạng thái</th>
              <th class="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="isLoading">
              <td colspan="7" class="px-6 py-10 text-center text-gray-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i><p>Đang tải dữ liệu...</p></td>
            </tr>
            <tr v-else-if="products.length === 0">
              <td colspan="7" class="px-6 py-10 text-center text-gray-400"><i class="fa-solid fa-box-open text-4xl mb-2 text-gray-300"></i><p>Không tìm thấy sản phẩm nào.</p></td>
            </tr>
            <tr v-else v-for="product in products" :key="product.id" class="hover:bg-gray-50 transition">
              <td class="px-6 py-4">
                <div class="flex items-center gap-4 group cursor-pointer" @click="openModal('view', product)">
                  <img :src="product.image?.split(',')[0] || placeholderImage(product.name)" class="w-12 h-12 rounded-lg object-cover border border-gray-200 group-hover:border-gray-400 transition" @error="handleImageError" />
                  <div>
                    <div class="font-semibold text-gray-900 group-hover:text-black group-hover:underline">{{ product.name }}</div>
                    <div class="text-gray-500 text-xs mt-0.5 truncate max-w-[200px]">{{ stripHtml(product.description) }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-gray-600">
                <span v-if="product.category_name" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{{ product.category_name }}</span>
                <span v-else class="text-gray-400 italic text-xs">Chưa phân loại</span>
              </td>
              <td class="px-6 py-4 font-medium text-gray-700 text-center">{{ product.quantity || 0 }}</td>
              
              <!-- Dữ liệu Đã Bán -->
              <td class="px-6 py-4 font-bold text-blue-600 text-center">{{ product.count_sold || 0 }}</td>

              <td class="px-6 py-4 font-medium text-gray-900">{{ formatPrice(product.price) }}</td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border" :class="product.status === 1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="product.status === 1 ? 'bg-green-500' : 'bg-red-500'"></span>
                  {{ product.status === 1 ? 'Đang bán' : 'Hết hàng' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openModal('edit', product)" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button>
                  <button @click="handleDelete(product)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Phân trang -->
      <div v-if="!isLoading && apiResponse" class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <span class="text-xs text-gray-500">Hiển thị trang <span class="font-semibold text-gray-900">{{ pageInfo.page }}</span></span>
        <div class="flex gap-2">
          <button @click="prevPage" :disabled="pageInfo.page <= 1" class="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">Trước</button>
          <button @click="nextPage" :disabled="!pageInfo.hasMore" class="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">Sau</button>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="isModalVisible" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div @click="closeModal" class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
        
        <div class="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center z-10">
          <h3 class="text-lg font-bold text-gray-900">{{ modalMode === 'view' ? 'Chi tiết sản phẩm' : modalMode === 'add' ? 'Thêm mới' : 'Cập nhật' }}</h3>
          <button @click="closeModal" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="p-6">
          <!-- VIEW MODE -->
          <div v-if="modalMode === 'view'" class="space-y-4">
            <div v-if="formData.images.length > 0" class="grid gap-2" :class="{'grid-cols-1': formData.images.length === 1, 'grid-cols-2': formData.images.length === 2, 'grid-cols-3': formData.images.length >= 3}">
              <img v-for="(img, idx) in formData.images" :key="idx" :src="img || placeholderImage(formData.name)" class="w-full aspect-square object-cover rounded-lg border border-gray-200" @error="handleImageError">
            </div>
            <div v-else class="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center"><span class="text-gray-400 text-sm">Không có ảnh</span></div>
            
            <div><label class="text-xs font-bold text-gray-400 uppercase">Tên</label><p class="text-lg font-bold text-gray-900">{{ formData.name }}</p></div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label class="text-xs font-bold text-gray-400 uppercase">Giá</label><p class="text-xl font-bold">{{ formatPrice(formData.price) }}</p></div>
              <div><label class="text-xs font-bold text-gray-400 uppercase">Kho</label><p class="font-medium text-gray-800">{{ formData.quantity }}</p></div>
              <!-- Hiển thị trong Modal -->
              <div><label class="text-xs font-bold text-gray-400 uppercase">Đã bán</label><p class="font-bold text-blue-600">{{ formData.count_sold || 0 }}</p></div>
              <div><label class="text-xs font-bold text-gray-400 uppercase">Danh mục</label><p class="font-medium">{{ formData.category_name || categories.find(c => c.id == formData.category_id)?.name || 'Chưa phân loại' }}</p></div>
            </div>
            <div><label class="text-xs font-bold text-gray-400 uppercase">Trạng thái</label><div><span class="inline-block px-2 py-1 bg-gray-100 rounded text-sm font-medium">{{ formData.status === 1 ? 'Đang bán' : 'Hết hàng' }}</span></div></div>
            <div><label class="text-xs font-bold text-gray-400 uppercase">Mô tả</label><div class="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg ql-editor" v-html="formData.description || 'Không có'"></div></div>
          </div>

          <!-- EDIT/ADD MODE -->
          <form v-else @submit.prevent="handleSubmit" class="space-y-5" novalidate>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Tên Sản Phẩm <span class="text-red-500">*</span></label><input v-model="formData.name" type="text" @input="clearError('name')" :class="{'border-red-500 focus:border-red-500 focus:ring-red-200': errors.name}" class="w-full px-4 py-2 border rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition" /><span v-if="errors.name" class="text-red-500 text-xs mt-1 block">{{ errors.name }}</span></div>
            <div class="grid grid-cols-2 gap-5">
              <div><label class="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ) <span class="text-red-500">*</span></label><input v-model.number="formData.price" type="number" @input="clearError('price')" :class="{'border-red-500 focus:border-red-500 focus:ring-red-200': errors.price}" class="w-full px-4 py-2 border rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition" /><span v-if="errors.price" class="text-red-500 text-xs mt-1 block">{{ errors.price }}</span></div>
              <div><label class="block text-sm font-medium text-gray-700 mb-1">Số lượng <span class="text-red-500">*</span></label><input v-model.number="formData.quantity" type="number" min="0" @input="clearError('quantity')" :class="{'border-red-500 focus:border-red-500 focus:ring-red-200': errors.quantity}" class="w-full px-4 py-2 border rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition" /><span v-if="errors.quantity" class="text-red-500 text-xs mt-1 block">{{ errors.quantity }}</span></div>
            </div>
            <div class="grid grid-cols-2 gap-5">
              <div><label class="block text-sm font-medium text-gray-700 mb-1">Danh Mục</label><select v-model="formData.category_id" @change="clearError('category_id')" :class="{'border-red-500 focus:border-red-500 focus:ring-red-200': errors.category_id}" class="w-full px-4 py-2 border rounded-lg focus:border-black outline-none bg-white transition"><option :value="null">-- Chưa phân loại --</option><option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option></select><span v-if="errors.category_id" class="text-red-500 text-xs mt-1 block">{{ errors.category_id }}</span></div>
              <div><label class="block text-sm font-medium text-gray-700 mb-1">Trạng Thái</label><select v-model="formData.status" class="w-full px-4 py-2 border rounded-lg focus:border-black outline-none bg-white"><option :value="1">Đang bán</option><option :value="0">Hết hàng</option></select></div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Hình Ảnh (Nhiều ảnh)</label>
              <input type="file" ref="fileInput" @change="handleFileUpload" accept="image/*" multiple class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
              <div v-if="formData.images.length > 0" class="grid grid-cols-4 gap-2 mt-3">
                <div v-for="(img, idx) in formData.images" :key="idx" class="relative group">
                  <img :src="img" class="w-full h-20 object-cover rounded border">
                  <button type="button" @click="removeImage(idx)" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">×</button>
                </div>
              </div>
            </div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Mô Tả</label><div class="editor-wrapper border rounded-lg overflow-hidden bg-white"><QuillEditor theme="snow" v-model:content="formData.description" contentType="html" toolbar="full" placeholder="Nhập mô tả chi tiết sản phẩm..." /></div></div>
            <div class="pt-4 border-t flex justify-end gap-3">
              <button type="button" @click="closeModal" class="px-5 py-2.5 rounded-lg border text-gray-700 hover:bg-gray-50">Hủy</button>
              <button type="submit" :disabled="isSubmitting" class="px-5 py-2.5 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center"><i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin mr-2"></i> {{ isSubmitting ? 'Đang lưu...' : 'Lưu lại' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
.animate-fade-in-up { animation: fadeInUp 0.2s ease-out forwards; }
:deep(.ql-editor) { min-height: 150px; font-size: 0.875rem; line-height: 1.5; }
:deep(.ql-toolbar) { border-top: none !important; border-left: none !important; border-right: none !important; border-bottom: 1px solid #e5e7eb !important; background-color: #f9fafb; }
:deep(.ql-container) { border: none !important; font-family: inherit; }
.editor-wrapper { border: 1px solid #e5e7eb; transition: all 0.2s; }
.editor-wrapper:focus-within { border-color: #000; box-shadow: 0 0 0 1px #000; }
</style>