<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// --- STATE ---
const product = ref(null);
const relatedProducts = ref([]);
const isLoading = ref(false);
const quantity = ref(1);

// Gallery Images
const mainImage = ref('');
const galleryImages = ref([]); 

// Expand Description
const isExpanded = ref(false);

// Tabs (Mô tả / Đánh giá / Bình luận)
const activeTab = ref('description');

// --- API CALLS ---

const fetchProductDetail = async (id) => {
  isLoading.value = true;
  try {
    const res = await fetch(`http://localhost:8080/api/products/${id}`);
    if (!res.ok) throw new Error("Lỗi tải sản phẩm");
    
    const data = await res.json();
    product.value = data;
    
    const baseImg = data.image || 'https://via.placeholder.com/500x500';
    mainImage.value = baseImg;
    
    // Yêu cầu: Chỉ cần 4 ảnh phụ
    galleryImages.value = [
      baseImg,
      'https://placehold.co/500x500/f3f4f6/000000?text=Side',
      'https://placehold.co/500x500/f3f4f6/000000?text=Back',
      'https://placehold.co/500x500/f3f4f6/000000?text=Detail'
    ];

    fetchRelatedProducts();

  } catch (error) {
    console.error(error);
    router.replace('/shop'); 
  } finally {
    isLoading.value = false;
  }
};

const fetchRelatedProducts = async () => {
  try {
    const res = await fetch(`http://localhost:8080/api/home?page=1&limit=4`);
    const result = await res.json();
    relatedProducts.value = result.data.filter(p => p.id !== product.value.id).slice(0, 4);
  } catch (error) {
    console.error("Lỗi tải sản phẩm liên quan:", error);
  }
};

// --- EVENTS ---

const setMainImage = (img) => {
  mainImage.value = img;
};

const updateQuantity = (change) => {
  const newVal = quantity.value + change;
  if (newVal >= 1) quantity.value = newVal;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchProductDetail(newId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

onMounted(() => {
  fetchProductDetail(route.params.id);
});
</script>

<template>
  <div class="product-detail-page bg-white min-h-screen pb-20">
    
    <!-- Loading State -->
    <div v-if="isLoading || !product" class="h-screen flex items-center justify-center">
      <div class="text-center">
        <i class="fa-solid fa-circle-notch fa-spin text-4xl text-black"></i>
        <p class="mt-4 text-gray-500 uppercase tracking-widest text-sm">Đang tải chi tiết...</p>
      </div>
    </div>

    <div v-else class="container mx-auto px-6 py-10 animate-fade-in">
      
      <!-- BREADCRUMB -->
      <nav class="text-xs text-gray-500 uppercase tracking-widest mb-10">
        <router-link to="/" class="hover:text-black">Trang chủ</router-link> 
        <span class="mx-2">/</span>
        <router-link to="/shop" class="hover:text-black">Cửa hàng</router-link>
        <span class="mx-2">/</span>
        <span class="text-black font-bold">{{ product.name }}</span>
      </nav>

      <!-- === MAIN SECTION: ẢNH & THÔNG TIN === -->
      <div class="flex flex-col lg:flex-row gap-12 mb-20">
        
        <!-- 1. LEFT: GALLERY (ẢNH) -->
        <div class="w-full lg:w-1/2">
          <!-- Ảnh Lớn (Vuông - aspect-square) -->
          <div class="aspect-square bg-gray-100 mb-4 relative overflow-hidden group cursor-zoom-in">
             <img 
               :src="mainImage" 
               class="w-full h-full object-cover object-center transition duration-500 group-hover:scale-110"
               alt="Main Product Image"
             >
             <span class="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1 uppercase tracking-wider">-20%</span>
          </div>

          <!-- Thumbnails (4 hình - grid-cols-4, Vuông - aspect-square) -->
          <div class="grid grid-cols-4 gap-4">
            <div 
              v-for="(img, idx) in galleryImages" 
              :key="idx"
              @click="setMainImage(img)"
              class="aspect-square bg-gray-50 cursor-pointer border transition hover:opacity-100"
              :class="mainImage === img ? 'border-black opacity-100' : 'border-transparent opacity-60'"
            >
              <img :src="img" class="w-full h-full object-cover">
            </div>
          </div>
        </div>

        <!-- 2. RIGHT: THÔNG TIN -->
        <div class="w-full lg:w-1/2 flex flex-col">
          
          <!-- Tên & Giá -->
          <h1 class="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter mb-4 leading-tight">
            {{ product.name }}
          </h1>
          
          <div class="flex items-center gap-4 mb-6">
            <span class="text-2xl font-bold text-black">{{ formatCurrency(product.price) }}</span>
            <span class="text-lg text-gray-400 line-through">{{ formatCurrency(product.price * 1.2) }}</span>
          </div>

          <!-- Thông tin Rating -->
          <div class="flex items-center gap-2 mb-8 text-sm">
            <div class="flex text-black text-xs">
               <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
            </div>
            <span class="text-gray-500">(4.8/5 từ 128 đánh giá)</span>
          </div>

          <!-- Mô tả ngắn -->
          <p class="text-gray-600 leading-relaxed mb-8 border-b border-gray-100 pb-8">
            {{ product.description || 'Sản phẩm chất lượng cao, thiết kế tối giản phù hợp với mọi phong cách. Chất liệu bền bỉ, thoáng mát.' }}
            Một sự lựa chọn hoàn hảo cho tủ đồ của bạn trong mùa này.
          </p>

          <!-- Chọn số lượng & Add to Cart -->
          <div class="flex flex-col sm:flex-row gap-4 mb-8">
            <div class="flex items-center border border-gray-300 w-32 h-12">
              <button @click="updateQuantity(-1)" class="w-10 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600 transition">-</button>
              <input type="text" :value="quantity" readonly class="w-12 h-full text-center outline-none bg-transparent font-bold text-black">
              <button @click="updateQuantity(1)" class="w-10 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600 transition">+</button>
            </div>

            <button class="flex-1 bg-black text-white h-12 font-bold uppercase tracking-widest hover:bg-gray-800 transition transform active:scale-95 shadow-lg flex items-center justify-center gap-3">
              <i class="fa-solid fa-bag-shopping"></i> Thêm vào giỏ
            </button>
            
            <button class="w-12 h-12 border border-gray-300 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition">
              <i class="fa-regular fa-heart"></i>
            </button>
          </div>

          <!-- Meta Info -->
          <div class="mt-auto space-y-2 text-xs text-gray-500 uppercase tracking-wider">
            <p>Mã SP: <span class="text-black">BW-{{ product.id }}</span></p>
            <p>Danh mục: <span class="text-black">Thời trang nam</span></p>
            <p>Tags: <span class="text-black">Minimalist, Black, Basic</span></p>
          </div>
          
          <!-- Share -->
          <div class="flex gap-4 mt-6 pt-6 border-t border-gray-100">
             <span class="text-xs font-bold uppercase">Chia sẻ:</span>
             <a href="#" class="text-gray-400 hover:text-black"><i class="fa-brands fa-facebook-f"></i></a>
             <a href="#" class="text-gray-400 hover:text-black"><i class="fa-brands fa-twitter"></i></a>
             <a href="#" class="text-gray-400 hover:text-black"><i class="fa-brands fa-pinterest"></i></a>
          </div>

        </div>
      </div>

      <!-- === BOTTOM SECTION: TABS === -->
      <div class="mb-20">
        <!-- Tab Header -->
        <div class="flex justify-center border-b border-gray-200 mb-8 gap-4 sm:gap-8">
          <button 
            @click="activeTab = 'description'"
            class="pb-4 px-4 text-sm font-bold uppercase tracking-widest border-b-2 transition"
            :class="activeTab === 'description' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'"
          >
            Mô tả chi tiết
          </button>
          <button 
            @click="activeTab = 'reviews'"
            class="pb-4 px-4 text-sm font-bold uppercase tracking-widest border-b-2 transition"
            :class="activeTab === 'reviews' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'"
          >
            Đánh giá (128)
          </button>
          <button 
            @click="activeTab = 'comments'"
            class="pb-4 px-4 text-sm font-bold uppercase tracking-widest border-b-2 transition"
            :class="activeTab === 'comments' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'"
          >
            Bình luận (45)
          </button>
        </div>

        <!-- Tab Content -->
        <div class="max-w-4xl mx-auto">
          
          <!-- Tab 1: Mô tả -->
          <div v-if="activeTab === 'description'">
            <div class="relative overflow-hidden transition-all duration-500" :class="isExpanded ? 'max-h-full' : 'max-h-[200px]'">
              <div class="prose prose-sm max-w-none text-gray-600 leading-7">
                <p class="mb-4 font-bold text-black">Đặc điểm nổi bật:</p>
                <ul class="list-disc pl-5 mb-4 space-y-2">
                  <li>Chất liệu Cotton 100% cao cấp, thoáng mát, thấm hút mồ hôi tốt.</li>
                  <li>Form dáng Regular Fit vừa vặn, tôn dáng người mặc.</li>
                  <li>Đường may tỉ mỉ, chắc chắn, không chỉ thừa.</li>
                  <li>Công nghệ nhuộm màu tiên tiến, không phai màu khi giặt.</li>
                </ul>
                <p class="mb-4 font-bold text-black">Hướng dẫn bảo quản:</p>
                <p>Giặt máy ở chế độ nhẹ, nhiệt độ thường. Không sử dụng chất tẩy mạnh. Sấy khô ở nhiệt độ thấp hoặc phơi trong bóng râm. Là ủi ở nhiệt độ trung bình.</p>
                <p class="mt-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              </div>
              
              <div v-if="!isExpanded" class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
            </div>

            <div class="text-center mt-6">
              <button 
                @click="isExpanded = !isExpanded" 
                class="border border-black px-8 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition"
              >
                {{ isExpanded ? 'Thu gọn' : 'Xem chi tiết' }}
              </button>
            </div>
          </div>

          <!-- Tab 2: Đánh giá (Reviews - Chỉ xem, không form) -->
          <div v-else-if="activeTab === 'reviews'" class="space-y-8 animate-fade-in">
             
             <div class="bg-gray-50 p-4 mb-6 text-center rounded text-sm text-gray-500 italic">
               * Chỉ những khách hàng đã mua sản phẩm mới có thể để lại đánh giá sao.
             </div>

             <!-- Review Item 1 -->
             <div class="border-b border-gray-100 pb-8">
               <div class="flex justify-between items-start mb-3">
                 <div class="flex items-center gap-3">
                   <div class="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">A</div>
                   <div>
                     <p class="font-bold text-sm text-black">Trần Văn A</p>
                     <!-- Stars -->
                     <div class="flex text-black text-[10px] mt-1">
                       <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                     </div>
                   </div>
                 </div>
                 <span class="text-xs text-gray-400">2 ngày trước</span>
               </div>
               <p class="text-gray-600 text-sm leading-relaxed">
                 Sản phẩm rất đẹp, đúng như mô tả. Giao hàng nhanh, đóng gói cẩn thận.
               </p>
               <div class="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
                 <i class="fa-solid fa-circle-check"></i> Đã mua hàng tại BW Store
               </div>
             </div>
             
             <!-- Review Item 2 -->
             <div class="border-b border-gray-100 pb-8">
               <div class="flex justify-between items-start mb-3">
                 <div class="flex items-center gap-3">
                   <img src="https://ui-avatars.com/api/?name=User+B&background=eee&color=000" class="w-10 h-10 rounded-full border border-gray-100">
                   <div>
                     <p class="font-bold text-sm text-black">Nguyễn Thị B</p>
                     <div class="flex text-black text-[10px] mt-1">
                       <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-regular fa-star"></i>
                     </div>
                   </div>
                 </div>
                 <span class="text-xs text-gray-400">1 tuần trước</span>
               </div>
               <p class="text-gray-600 text-sm leading-relaxed">
                 Vải mềm, mặc mát. Form áo hơi rộng một chút so với bảng size nhưng vẫn oke.
               </p>
                <div class="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
                 <i class="fa-solid fa-circle-check"></i> Đã mua hàng tại BW Store
               </div>
             </div>
          </div>

          <!-- Tab 3: Bình luận (Comments - Thảo luận chung, có form) -->
          <div v-else-if="activeTab === 'comments'" class="space-y-8 animate-fade-in">
             
             <!-- Comment 1 -->
             <div class="flex gap-4">
                <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">K</div>
                <div class="flex-1">
                   <div class="flex items-center justify-between mb-1">
                      <p class="font-bold text-sm text-black">Khách hàng</p>
                      <span class="text-xs text-gray-400">Hôm qua</span>
                   </div>
                   <p class="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg rounded-tl-none">
                      Shop ơi cho mình hỏi mẫu này 1m7 65kg mặc size gì vừa ạ?
                   </p>
                   <!-- Reply from Shop -->
                   <div class="flex gap-4 mt-3 ml-4">
                      <div class="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-xs">BW</div>
                      <div class="flex-1">
                         <div class="flex items-center justify-between mb-1">
                            <p class="font-bold text-xs text-black">BW Store <i class="fa-solid fa-circle-check text-blue-500 ml-1"></i></p>
                         </div>
                         <p class="text-gray-600 text-xs bg-gray-100 p-2 rounded-lg rounded-tl-none">
                            Chào bạn, với chiều cao cân nặng này bạn mặc size L là vừa đẹp nhé ạ!
                         </p>
                      </div>
                   </div>
                </div>
             </div>

             <!-- Form Viết Bình Luận -->
             <div class="mt-8 pt-8 border-t border-gray-100">
                <h3 class="font-bold text-sm uppercase mb-4">Hỏi đáp về sản phẩm</h3>
                <textarea class="w-full border border-gray-200 p-3 text-sm focus:border-black outline-none rounded bg-white min-h-[100px]" placeholder="Viết câu hỏi hoặc bình luận của bạn..."></textarea>
                <div class="flex justify-end mt-3">
                   <button class="bg-black text-white px-6 py-2 text-xs font-bold uppercase hover:bg-gray-800 transition">Gửi câu hỏi</button>
                </div>
             </div>
          </div>

        </div>
      </div>

      <!-- === SẢN PHẨM LIÊN QUAN === -->
      <div v-if="relatedProducts.length > 0">
        <div class="flex justify-between items-end mb-8">
          <h2 class="text-2xl font-bold uppercase tracking-tighter">Có thể bạn thích</h2>
          <router-link to="/shop" class="text-xs font-bold underline hover:text-gray-600">Xem tất cả</router-link>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div 
            v-for="relProd in relatedProducts" 
            :key="relProd.id"
            class="group cursor-pointer"
            @click="router.push(`/product/${relProd.id}`)"
          >
            <!-- Thumbnail sản phẩm liên quan cũng Vuông luôn cho đẹp -->
            <div class="relative overflow-hidden aspect-square bg-gray-100 mb-3">
              <img 
                :src="relProd.image || 'https://via.placeholder.com/300x300'" 
                class="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                @error="$event.target.src='https://via.placeholder.com/300x300?text=Err'"
              >
              <div class="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition"></div>
            </div>
            <h3 class="text-sm font-bold group-hover:underline truncate">{{ relProd.name }}</h3>
            <p class="text-gray-500 text-xs">{{ formatCurrency(relProd.price) }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>