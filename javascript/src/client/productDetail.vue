<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// --- STATE ---
const product = ref(null);
const relatedProducts = ref([]);
const isLoading = ref(false);
const quantity = ref(1);
const activeTab = ref('description');
const isExpanded = ref(false);

// Gallery
const mainImage = ref('');
const galleryImages = ref([]); 

// --- HELPERS ---
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const getFullImageUrl = (imgStr) => {
  if (!imgStr) return 'https://via.placeholder.com/500x500?text=No+Image';
  const s = imgStr.trim();
  return s.startsWith('http') ? s : `http://localhost:8080/uploads/${s}`;
};

const processImages = (imageString) => {
    if (!imageString) return ['https://via.placeholder.com/500x500?text=No+Image'];
    let imgs = imageString.split(',').map(s => getFullImageUrl(s));
    return imgs.length ? imgs : ['https://via.placeholder.com/500x500?text=No+Image'];
};

// --- API ---
const fetchProductDetail = async (id) => {
  isLoading.value = true;
  try {
    const res = await fetch(`http://localhost:8080/api/products/${id}`);
    if (!res.ok) throw new Error(res.status === 404 ? "Sản phẩm không tồn tại" : "Lỗi tải sản phẩm");
    
    const data = await res.json();
    product.value = data;
    
    // Setup Gallery
    const images = processImages(data.image);
    galleryImages.value = images;
    mainImage.value = images[0]; 

    fetchRelatedProducts();
  } catch (error) {
    console.error(error);
    router.replace('/shop'); 
  } finally {
    setTimeout(() => { isLoading.value = false; }, 300);
  }
};

const fetchRelatedProducts = async () => {
  try {
    const res = await fetch(`http://localhost:8080/api/home?page=1&limit=5`);
    const result = await res.json();
    if (result.data) {
        relatedProducts.value = result.data.filter(p => p.id != product.value.id).slice(0, 4);
    }
  } catch (error) {
    console.error("Lỗi tải sản phẩm liên quan:", error);
  }
};

// --- EVENTS ---
const setMainImage = (img) => mainImage.value = img;

const updateQuantity = (change) => {
  const newVal = quantity.value + change;
  if (newVal >= 1) quantity.value = newVal;
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
  <div class="product-detail-page bg-white min-h-screen pb-20 font-sans text-gray-800">
    
    <div v-if="isLoading || !product" class="h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto"></div>
        <p class="mt-4 text-gray-500 uppercase tracking-widest text-sm">Đang tải chi tiết...</p>
      </div>
    </div>

    <div v-else class="container mx-auto px-6 py-10 animate-fade-in">
      
      <nav class="text-xs text-gray-500 uppercase tracking-widest mb-10">
        <router-link to="/" class="hover:text-black">Trang chủ</router-link> 
        <span class="mx-2">/</span>
        <router-link to="/shop" class="hover:text-black">Cửa hàng</router-link>
        <span class="mx-2">/</span>
        <span class="text-black font-bold">{{ product.name }}</span>
      </nav>

      <div class="flex flex-col lg:flex-row gap-12 mb-20">
        
        <div class="w-full lg:w-1/2">
          <div class="aspect-[4/5] bg-gray-100 mb-4 relative overflow-hidden group cursor-zoom-in border border-gray-100">
             <img :src="mainImage" class="w-full h-full object-cover object-center transition duration-500 group-hover:scale-105" alt="Main Product Image" @error="$event.target.src='https://via.placeholder.com/500x500?text=Image+Error'">
             <span v-if="product.status === 1" class="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1 uppercase tracking-wider">New Arrival</span>
          </div>

          <div class="grid grid-cols-4 gap-4" v-if="galleryImages.length > 1">
            <div v-for="(img, idx) in galleryImages" :key="idx" @click="setMainImage(img)" 
                 class="aspect-square bg-gray-50 cursor-pointer border transition hover:opacity-100 overflow-hidden"
                 :class="mainImage === img ? 'border-black opacity-100 ring-1 ring-black' : 'border-transparent opacity-60'">
              <img :src="img" class="w-full h-full object-cover" @error="$event.target.src='https://via.placeholder.com/150?text=Err'">
            </div>
          </div>
        </div>

        <div class="w-full lg:w-1/2 flex flex-col">
          <h1 class="text-3xl md:text-4xl font-black text-black uppercase tracking-tighter mb-4 leading-tight">{{ product.name }}</h1>
          
          <div class="flex items-center gap-4 mb-6">
            <span class="text-2xl font-bold text-black">{{ formatCurrency(product.price) }}</span>
            <span class="text-lg text-gray-400 line-through">{{ formatCurrency(product.price * 1.2) }}</span>
          </div>

          <div class="flex items-center gap-2 mb-8 text-sm">
            <div class="flex text-black text-xs">
               <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
            </div>
            <span class="text-gray-500">(4.8/5 từ 128 đánh giá)</span>
          </div>

          <div class="text-gray-600 leading-relaxed mb-8 border-b border-gray-100 pb-8 line-clamp-3 prose prose-sm max-w-none" v-html="product.description"></div>

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

          <div class="mt-auto space-y-2 text-xs text-gray-500 uppercase tracking-wider">
            <p>Mã SP: <span class="text-black">PROD-{{ product.id }}</span></p>
            <p>Tình trạng: <span class="text-black font-bold">{{ product.status === 1 ? 'Còn hàng' : 'Hết hàng' }}</span></p>
            <p>Tags: <span class="text-black">Minimalist, Black, Basic</span></p>
          </div>
          
          <div class="flex gap-4 mt-6 pt-6 border-t border-gray-100">
             <span class="text-xs font-bold uppercase">Chia sẻ:</span>
             <a href="#" class="text-gray-400 hover:text-black"><i class="fa-brands fa-facebook-f"></i></a>
             <a href="#" class="text-gray-400 hover:text-black"><i class="fa-brands fa-twitter"></i></a>
             <a href="#" class="text-gray-400 hover:text-black"><i class="fa-brands fa-pinterest"></i></a>
          </div>
        </div>
      </div>

      <div class="mb-20">
        <div class="flex justify-center border-b border-gray-200 mb-8 gap-4 sm:gap-8 overflow-x-auto">
          <button @click="activeTab = 'description'" class="pb-4 px-4 text-sm font-bold uppercase tracking-widest border-b-2 transition whitespace-nowrap" :class="activeTab === 'description' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'">Mô tả chi tiết</button>
          <button @click="activeTab = 'reviews'" class="pb-4 px-4 text-sm font-bold uppercase tracking-widest border-b-2 transition whitespace-nowrap" :class="activeTab === 'reviews' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'">Đánh giá (128)</button>
          <button @click="activeTab = 'comments'" class="pb-4 px-4 text-sm font-bold uppercase tracking-widest border-b-2 transition whitespace-nowrap" :class="activeTab === 'comments' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'">Bình luận (45)</button>
        </div>

        <div class="max-w-4xl mx-auto">
          <div v-if="activeTab === 'description'">
            <div class="relative overflow-hidden transition-all duration-500" :class="isExpanded ? 'max-h-full' : 'max-h-[500px]'">
              <div class="prose prose-sm max-w-none text-gray-600 leading-7 [&>img]:w-full [&>img]:rounded-lg [&>img]:my-4" v-html="product.description"></div>
              <div v-if="!isExpanded" class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
            </div>
            <div class="text-center mt-6">
              <button @click="isExpanded = !isExpanded" class="border border-black px-8 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition">
                {{ isExpanded ? 'Thu gọn' : 'Xem chi tiết' }}
              </button>
            </div>
          </div>

          <div v-else-if="activeTab === 'reviews'" class="space-y-8 animate-fade-in">
             <div class="bg-gray-50 p-4 text-center rounded text-sm text-gray-500 italic">* Tính năng đánh giá đang được phát triển. Dưới đây là dữ liệu mẫu.</div>
             <div class="border-b border-gray-100 pb-8">
               <div class="flex justify-between items-start mb-3">
                 <div class="flex items-center gap-3">
                   <div class="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">A</div>
                   <div>
                     <p class="font-bold text-sm text-black">Trần Văn A</p>
                     <div class="flex text-black text-[10px] mt-1"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
                   </div>
                 </div>
                 <span class="text-xs text-gray-400">2 ngày trước</span>
               </div>
               <p class="text-gray-600 text-sm leading-relaxed">Sản phẩm rất đẹp, đúng như mô tả. Giao hàng nhanh.</p>
             </div>
          </div>

          <div v-else-if="activeTab === 'comments'" class="space-y-8 animate-fade-in">
             <div class="bg-gray-50 p-6 rounded-lg">
                <h3 class="font-bold text-sm uppercase mb-4">Hỏi đáp về sản phẩm</h3>
                <textarea class="w-full border border-gray-200 p-3 text-sm focus:border-black outline-none rounded bg-white min-h-[100px]" placeholder="Viết câu hỏi của bạn..."></textarea>
                <div class="flex justify-end mt-3">
                   <button class="bg-black text-white px-6 py-2 text-xs font-bold uppercase hover:bg-gray-800 transition">Gửi câu hỏi</button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div v-if="relatedProducts.length > 0">
        <div class="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
          <h2 class="text-2xl font-bold uppercase tracking-tighter">Có thể bạn thích</h2>
          <router-link to="/shop" class="text-xs font-bold underline hover:text-gray-600">Xem tất cả</router-link>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="relProd in relatedProducts" :key="relProd.id" class="group cursor-pointer" @click="router.push(`/productDetail/${relProd.id}`)">
            <div class="relative overflow-hidden aspect-[3/4] bg-gray-100 mb-3">
              <img :src="getFullImageUrl(relProd.image ? relProd.image.split(',')[0] : '')" 
                   class="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                   @error="$event.target.src='https://via.placeholder.com/300x400?text=Err'">
              <div class="absolute inset-x-0 bottom-0 p-2 translate-y-full group-hover:translate-y-0 transition duration-300 flex justify-center gap-2 pb-4">
                 <button class="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center hover:bg-black hover:text-white shadow-md text-xs"><i class="fa-solid fa-cart-plus"></i></button>
                 <button class="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center hover:bg-black hover:text-white shadow-md text-xs"><i class="fa-regular fa-eye"></i></button>
              </div>
            </div>
            <h3 class="text-sm font-bold group-hover:underline truncate text-gray-900">{{ relProd.name }}</h3>
            <p class="text-gray-500 text-xs font-bold mt-1">{{ formatCurrency(relProd.price) }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>