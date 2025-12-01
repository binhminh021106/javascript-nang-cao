<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

// --- STATE ---
const products = ref([]);
const isLoading = ref(false);
const currentPage = ref(1);
const totalPages = ref(0);
const totalItems = ref(0);
const limit = 10; 

// Filter State (Lưu ý: Backend hiện tại chưa hỗ trợ lọc, đây là UI state chuẩn bị cho nâng cấp sau này)
const selectedCategory = ref('all');
const priceRange = ref(10000000); 
const sortOption = ref('newest');

// Danh mục giả (Hardcode vì backend chưa có bảng categories)
const categories = [
  { id: 'all', name: 'Tất cả sản phẩm' },
  { id: 'men', name: 'Thời trang Nam' },
  { id: 'women', name: 'Thời trang Nữ' },
  { id: 'accessories', name: 'Phụ kiện' },
  { id: 'footwear', name: 'Giày dép' }
];

// --- HELPER FUNCTIONS ---

/**
 * Xử lý ảnh từ Backend.
 * Backend trả về chuỗi "url1,url2", ta cần tách ra lấy cái đầu tiên.
 */
const getThumbnail = (imageString) => {
  if (!imageString) return 'https://via.placeholder.com/300x400?text=No+Image';
  // Nếu có dấu phẩy, tách mảng và lấy phần tử đầu
  if (imageString.includes(',')) {
    return imageString.split(',')[0].trim();
  }
  return imageString;
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// --- API CALL ---
const fetchProducts = async (page) => {
  isLoading.value = true;
  try {
    // Gọi API từ Backend Node.js
    // Backend endpoint: /api/home?page=1&limit=10
    const response = await fetch(`http://localhost:8080/api/home?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // LOGIC MAPPING DỮ LIỆU QUAN TRỌNG
    products.value = result.data; // Backend trả về mảng trong key 'data'
    
    // Backend trả về key 'total', Frontend cũ đang đợi 'totalItems' -> Sửa lại cho khớp
    totalItems.value = result.total; 
    
    totalPages.value = Math.ceil(result.total / limit);
    currentPage.value = parseInt(result.page); // Đảm bảo là số nguyên
    
    // Scroll lên đầu trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
    products.value = []; // Reset về rỗng nếu lỗi
  } finally {
    setTimeout(() => { isLoading.value = false; }, 300);
  }
};

// --- EVENTS ---
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    fetchProducts(page);
  }
};

// Lifecycle
onMounted(() => {
  fetchProducts(1);
});

// Watchers (Để mở rộng sau này khi Backend hỗ trợ filter)
watch([selectedCategory, sortOption], () => {
    // Reset về trang 1 khi thay đổi bộ lọc
    // Hiện tại Backend chưa support filter params, nhưng logic Frontend đã sẵn sàng
    console.log("Filter changed:", selectedCategory.value, sortOption.value);
    fetchProducts(1);
});
</script>

<template>
  <div class="shop-page bg-white min-h-screen font-sans text-gray-800">
    
    <!-- 1. HEADER PAGE -->
    <div class="bg-gray-50 border-b border-gray-200 py-10">
      <div class="container mx-auto px-6 text-center">
        <h1 class="text-4xl font-black tracking-tighter uppercase mb-2">Cửa Hàng</h1>
        <p class="text-xs text-gray-500 uppercase tracking-widest">
          Trang chủ / <span class="text-black font-bold">Sản phẩm</span>
        </p>
      </div>
    </div>

    <div class="container mx-auto px-6 py-12">
      <div class="flex flex-col lg:flex-row gap-12">
        
        <!-- === SIDEBAR (BÊN TRÁI) === -->
        <aside class="w-full lg:w-1/4 space-y-10">
          
          <!-- Box 1: Tìm kiếm -->
          <div>
             <h3 class="text-sm font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">Tìm Kiếm</h3>
             <div class="relative">
               <input type="text" placeholder="Tên sản phẩm..." class="w-full border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black transition bg-gray-50 focus:bg-white">
               <button class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                 <i class="fa-solid fa-magnifying-glass"></i>
               </button>
             </div>
          </div>

          <!-- Box 2: Danh Mục -->
          <div>
            <h3 class="text-sm font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">Danh Mục</h3>
            <ul class="space-y-2">
              <li v-for="cat in categories" :key="cat.id">
                <button 
                  @click="selectedCategory = cat.id"
                  class="flex items-center justify-between w-full text-left text-sm py-2 hover:text-black transition group"
                  :class="selectedCategory === cat.id ? 'text-black font-bold' : 'text-gray-500'"
                >
                  <span>{{ cat.name }}</span>
                  <i v-if="selectedCategory === cat.id" class="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </li>
            </ul>
          </div>

          <!-- Box 3: Lọc Giá -->
          <div>
            <h3 class="text-sm font-bold uppercase tracking-widest mb-4 border-l-4 border-black pl-3">Khoảng Giá</h3>
            <input 
              type="range" 
              min="0" 
              max="10000000" 
              step="100000"
              v-model="priceRange"
              class="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            >
            <div class="flex justify-between mt-2 text-xs font-medium text-gray-600">
              <span>0 ₫</span>
              <span>{{ formatCurrency(priceRange) }}</span>
            </div>
            <button class="w-full mt-4 bg-black text-white text-xs font-bold uppercase py-3 tracking-widest hover:bg-gray-800 transition">
              Áp dụng
            </button>
          </div>

          <!-- Box 4: Banner -->
          <div class="bg-gray-100 p-6 text-center relative overflow-hidden group">
             <div class="absolute inset-0 bg-opacity-10 pointer-events-none"></div>
             <p class="text-xs font-bold text-gray-400 mb-2 uppercase">Summer Sale</p>
             <h4 class="text-2xl font-black mb-4">GIẢM 50%</h4>
             <button class="border-b border-black text-xs uppercase font-bold hover:text-gray-600">Xem ngay</button>
          </div>

        </aside>

        <!-- === MAIN CONTENT (BÊN PHẢI) === -->
        <main class="w-full lg:w-3/4">
          
          <!-- Toolbar -->
          <div class="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-100">
             <p class="text-sm text-gray-500 mb-4 sm:mb-0">
               Hiển thị <span class="font-bold text-black">{{ products.length > 0 ? (currentPage - 1) * limit + 1 : 0 }}–{{ Math.min(currentPage * limit, totalItems) }}</span> trong tổng số <span class="font-bold text-black">{{ totalItems }}</span> kết quả
             </p>
             
             <div class="flex items-center gap-3">
               <label class="text-sm text-gray-500 hidden sm:block">Sắp xếp:</label>
               <select v-model="sortOption" class="border border-gray-300 text-sm px-3 py-2 outline-none focus:border-black cursor-pointer bg-white">
                 <option value="newest">Mới nhất</option>
                 <option value="price_asc">Giá: Thấp đến Cao</option>
                 <option value="price_desc">Giá: Cao đến Thấp</option>
                 <option value="name_asc">Tên: A-Z</option>
               </select>
             </div>
          </div>

          <!-- PRODUCT GRID -->
          <div class="relative min-h-[500px]">
            
            <!-- Loading Overlay -->
            <div v-if="isLoading" class="absolute inset-0 z-10 bg-white/80 flex items-center justify-center">
               <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            </div>

            <!-- Empty State -->
            <div v-if="products.length === 0 && !isLoading" class="flex flex-col items-center justify-center py-20 text-gray-400">
               <i class="fa-solid fa-box-open text-6xl mb-4 text-gray-200"></i>
               <p class="text-lg">Chưa có sản phẩm nào.</p>
            </div>

            <!-- Grid Items -->
            <div 
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 transition-opacity duration-300"
              :class="{ 'opacity-40': isLoading }"
            >
              
              <div 
                v-for="product in products" 
                :key="product.id" 
                class="group bg-white"
              >
                <!-- Image Wrapper -->
                <div class="relative overflow-hidden aspect-[3/4] bg-gray-100 mb-4">
                  <!-- Badges -->
                  <div class="absolute top-3 left-3 flex flex-col gap-1 z-10">
                    <span v-if="product.status === 1" class="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">New</span>
                    <!-- Giả lập badge giảm giá ngẫu nhiên cho đẹp -->
                    <span v-if="product.price > 5000000" class="bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">-20%</span>
                  </div>

                  <!-- Image: Sử dụng helper function getThumbnail -->
                  <img 
                    :src="getThumbnail(product.image)" 
                    :alt="product.name"
                    class="w-full h-full object-cover object-center group-hover:scale-105 transition duration-700 ease-in-out"
                    @error="$event.target.src='https://via.placeholder.com/300x400?text=Err'"
                  >

                  <!-- Actions Overlay -->
                  <div class="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition duration-300 bg-gradient-to-t from-black/50 to-transparent flex justify-center gap-3">
                    <button class="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition shadow-lg" title="Thêm vào giỏ">
                      <i class="fa-solid fa-cart-plus"></i>
                    </button>
                    <!-- Router Link to Detail -->
                    <router-link :to="`/productDetail/${product.id}`" class="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition shadow-lg" title="Xem chi tiết">
                      <i class="fa-regular fa-eye"></i>
                    </router-link>
                    <button class="bg-white text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition shadow-lg" title="Yêu thích">
                      <i class="fa-regular fa-heart"></i>
                    </button>
                  </div>
                </div>

                <!-- Info -->
                <div class="text-center px-2">
                   <p class="text-xs text-gray-400 uppercase tracking-widest mb-1">
                     {{ categories.find(c => c.id === 'men')?.name || 'Fashion' }}
                   </p>
                   <h3 class="text-base font-bold text-gray-900 group-hover:text-black cursor-pointer mb-2 truncate">
                     {{ product.name }}
                   </h3>
                   <div class="flex justify-center items-center gap-3">
                     <span class="text-lg font-bold text-black">{{ formatCurrency(product.price) }}</span>
                   </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="mt-16 flex justify-center gap-2">
            <!-- Nút Prev -->
            <button 
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1 || isLoading"
              class="w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black transition cursor-pointer disabled:cursor-not-allowed"
            >
              <i class="fa-solid fa-chevron-left"></i>
            </button>

            <!-- Logic hiển thị trang thông minh hơn 1 chút -->
            <template v-for="page in totalPages" :key="page">
                <!-- Chỉ hiển thị trang gần current, đầu và cuối để tránh quá dài nếu nhiều trang -->
                <button 
                  v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
                  @click="changePage(page)"
                  :disabled="isLoading"
                  :class="[
                    'w-10 h-10 border flex items-center justify-center transition font-bold text-sm cursor-pointer disabled:cursor-not-allowed',
                    currentPage === page 
                      ? 'bg-black text-white border-black' 
                      : 'border-gray-300 hover:bg-gray-100 text-gray-600'
                  ]"
                >
                  {{ page }}
                </button>
                <span v-else-if="page === currentPage - 2 || page === currentPage + 2" class="w-10 h-10 flex items-center justify-center text-gray-400">...</span>
            </template>

            <!-- Nút Next -->
            <button 
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages || isLoading"
              class="w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black transition cursor-pointer disabled:cursor-not-allowed"
            >
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>

        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tailwind handles almost everything. 
   Adding just a tiny bit of transition for the smooth feel 
*/
</style>