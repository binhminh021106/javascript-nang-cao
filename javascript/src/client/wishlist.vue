<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// --- STATE (Mock Data) ---
const wishlistItems = ref([
  {
    id: 101,
    name: 'GIÀY FORUM LOW CL',
    price: 2600000,
    originalPrice: null,
    category: 'Nam Originals',
    image: 'https://placehold.co/400x400/f3f4f6/000000?text=Forum+Low',
    isNew: true
  },
  {
    id: 102,
    name: 'ÁO KHOÁC GIÓ ADICOLOR',
    price: 1800000,
    originalPrice: 2500000,
    category: 'Nam Thời trang',
    image: 'https://placehold.co/400x400/f3f4f6/000000?text=Ao+Khoac',
    isNew: false
  },
  {
    id: 103,
    name: 'TÚI ĐEO CHÉO ESSENTIAL',
    price: 450000,
    originalPrice: null,
    category: 'Phụ kiện',
    image: 'https://placehold.co/400x400/f3f4f6/000000?text=Tui+Deo',
    isNew: false
  },
  {
    id: 104,
    name: 'MŨ LƯỠI TRAI BASEBALL',
    price: 350000,
    originalPrice: null,
    category: 'Unisex',
    image: 'https://placehold.co/400x400/f3f4f6/000000?text=Mu+Luoi+Trai',
    isNew: true
  }
]);

// --- METHODS ---
const removeFromWishlist = (id) => {
  // Hiệu ứng UI giả lập xóa
  if(confirm('Bỏ sản phẩm này khỏi danh sách yêu thích?')) {
    wishlistItems.value = wishlistItems.value.filter(item => item.id !== id);
  }
};

const addToCart = (item) => {
  alert(`Đã thêm "${item.name}" vào giỏ hàng!`);
  // Logic gọi store/API thêm vào giỏ ở đây
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
</script>

<template>
  <div class="wishlist-page bg-white min-h-screen pb-20">
    
    <!-- Header Section -->
    <div class="container mx-auto px-6 pt-12 pb-8">
      <h1 class="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
        Danh sách yêu thích 
        <span class="text-gray-400 font-medium text-lg align-middle ml-2">({{ wishlistItems.length }} sản phẩm)</span>
      </h1>
      <p class="text-sm text-gray-500">Đừng để lỡ mất những món đồ bạn yêu thích.</p>
    </div>

    <div class="container mx-auto px-6">
      
      <!-- EMPTY STATE -->
      <div v-if="wishlistItems.length === 0" class="py-20 text-center border-t border-gray-100">
        <div class="mb-6 inline-block p-6 rounded-full bg-gray-50">
           <i class="fa-regular fa-heart text-4xl text-gray-300"></i>
        </div>
        <h2 class="text-xl font-bold mb-2">Danh sách yêu thích của bạn đang trống</h2>
        <p class="text-gray-500 mb-8 text-sm">Hãy khám phá thêm các sản phẩm và thêm vào đây nhé.</p>
        <button 
          @click="router.push('/shop')"
          class="bg-black text-white px-8 py-3 uppercase font-bold text-xs tracking-widest hover:opacity-80 transition flex items-center gap-3 mx-auto"
        >
          Khám phá ngay <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>

      <!-- WISHLIST GRID -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
        
        <div 
          v-for="item in wishlistItems" 
          :key="item.id" 
          class="group relative flex flex-col"
        >
          <!-- Heart Remove Button (Góc phải trên) -->
          <button 
            @click="removeFromWishlist(item.id)"
            class="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-transparent hover:bg-gray-100 rounded transition"
            title="Bỏ thích"
          >
            <i class="fa-solid fa-heart text-black text-lg"></i>
          </button>

          <!-- Tag (Góc trái trên) -->
          <div v-if="item.isNew" class="absolute top-3 left-3 z-10 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider border border-black">
            Mới
          </div>
          <div v-else-if="item.originalPrice" class="absolute top-3 left-3 z-10 bg-black text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
            Giảm giá
          </div>

          <!-- Image Container -->
          <div 
            class="relative aspect-square bg-gray-100 cursor-pointer mb-4 overflow-hidden"
            @click="router.push(`/product/${item.id}`)"
          >
            <img 
              :src="item.image" 
              class="w-full h-full object-cover transition duration-700 group-hover:scale-105"
            >
            <!-- Add to Cart Overlay (Mobile: Luôn hiện nút dưới, Desktop: Hover hiện giá hoặc nút) -->
          </div>

          <!-- Info Section -->
          <div class="flex flex-col flex-grow">
            <!-- Name & Category -->
            <div class="mb-2 cursor-pointer" @click="router.push(`/product/${item.id}`)">
              <p class="text-xs text-gray-500 mb-1">{{ item.category }}</p>
              <h3 class="text-sm font-bold text-black uppercase tracking-tight group-hover:underline line-clamp-1">
                {{ item.name }}
              </h3>
            </div>

            <!-- Price -->
            <div class="mb-4 flex items-center gap-2 text-sm">
              <span class="font-medium" :class="item.originalPrice ? 'text-red-600' : 'text-black'">
                {{ formatCurrency(item.price) }}
              </span>
              <span v-if="item.originalPrice" class="text-gray-400 line-through text-xs">
                {{ formatCurrency(item.originalPrice) }}
              </span>
            </div>

            <!-- Action Button (Style Adidas: Chữ in hoa, gạch chân hoặc khung) -->
            <div class="mt-auto pt-4 border-t border-transparent group-hover:border-gray-200 transition">
               <button 
                 @click="addToCart(item)"
                 class="w-full bg-white border border-black text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition"
               >
                 Thêm vào giỏ hàng
               </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Không cần CSS thêm vì đã dùng Tailwind */
</style>