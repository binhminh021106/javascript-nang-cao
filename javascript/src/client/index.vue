<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// --- STATE ---
const products = ref([]);
const isLoading = ref(false);
const currentPage = ref(1);
const totalPages = ref(0);
const limit = 5;

// Danh mục giả
const categories = ref([
  { name: 'Thời Trang Nam', count: 120, icon: 'fa-solid fa-shirt' },
  { name: 'Phụ Kiện', count: 45, icon: 'fa-regular fa-clock' },
  { name: 'Giày & Dép', count: 80, icon: 'fa-solid fa-shoe-prints' }
]);

// Timer
const timer = ref({ hours: 0, minutes: 0, seconds: 0 });
let timerInterval = null;

// --- LOGIC GỌI API ---
const fetchProducts = async (page) => {
  isLoading.value = true;
  try {
    const response = await fetch(`http://localhost:8080/api/home?page=${page}&limit=${limit}`);
    const result = await response.json();

    products.value = result.data;
    totalPages.value = Math.ceil(result.totalItems / limit);
    currentPage.value = result.page;

  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    setTimeout(() => { isLoading.value = false; }, 300);
  }
};

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value && !isLoading.value) {
    fetchProducts(page);
    document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// ✅ HÀM MỚI: Xử lý chuỗi ảnh để lấy ảnh đầu tiên
const getMainImage = (imgString) => {
  if (!imgString) return 'https://via.placeholder.com/300x400?text=No+Image';
  // Nếu có dấu phẩy (nhiều ảnh), cắt lấy cái đầu tiên
  if (imgString.includes(',')) {
    return imgString.split(',')[0].trim();
  }
  return imgString;
};

const startCountdown = () => {
  const endTime = new Date().getTime() + (2 * 60 * 60 * 1000 + 15 * 60 * 1000);
  timerInterval = setInterval(() => {
    const now = new Date().getTime();
    const distance = endTime - now;
    if (distance < 0) {
      clearInterval(timerInterval);
      return;
    }
    timer.value.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    timer.value.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    timer.value.seconds = Math.floor((distance % (1000 * 60)) / 1000);
  }, 1000);
};

onMounted(() => {
  fetchProducts(1);
  startCountdown();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<template>
  <div class="home-page pb-20">

    <section class="relative bg-black text-white h-[500px] flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div class="z-10 text-center px-4 animate-fade-in-up">
        <p class="text-sm uppercase tracking-[0.5em] mb-4 text-gray-400">Summer Collection 2025</p>
        <h1 class="text-5xl md:text-7xl font-bold mb-6 tracking-tighter">MONOCHROME</h1>
        <p class="text-gray-300 max-w-xl mx-auto mb-8 font-light">
          Sự tinh tế đến từ những điều đơn giản nhất. Khám phá phong cách tối giản ngay hôm nay.
        </p>
        <button class="bg-white text-black px-8 py-3 uppercase font-bold text-xs tracking-widest hover:bg-gray-200 transition transform hover:scale-105">
          Khám Phá Ngay
        </button>
      </div>
    </section>

    <section class="container mx-auto px-4 -mt-16 relative z-20">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="(cat, index) in categories" :key="index" class="bg-white p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition group cursor-pointer text-center">
          <div class="text-4xl mb-4 text-gray-800 group-hover:text-black transition">
            <i :class="cat.icon"></i>
          </div>
          <h3 class="text-xl font-bold uppercase tracking-wide mb-2">{{ cat.name }}</h3>
          <p class="text-gray-500 text-sm">Xem {{ cat.count }} sản phẩm</p>
        </div>
      </div>
    </section>

    <section class="container mx-auto px-4 mt-20 mb-10">
      <div class="border border-black p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-4">
          <span class="bg-black text-white px-3 py-1 text-xs font-bold uppercase blink-animation">Flash Sale</span>
          <h2 class="text-2xl font-bold uppercase tracking-tighter">Ưu Đãi Kết Thúc Trong</h2>
        </div>
        <div class="flex gap-4 font-mono text-2xl font-bold">
          <div class="flex flex-col items-center">
            <span class="bg-gray-100 w-12 h-12 flex items-center justify-center rounded">{{ timer.hours }}</span>
            <span class="text-xs font-light mt-1 text-gray-500">Giờ</span>
          </div>
          <span class="mt-2">:</span>
          <div class="flex flex-col items-center">
            <span class="bg-gray-100 w-12 h-12 flex items-center justify-center rounded">{{ timer.minutes }}</span>
            <span class="text-xs font-light mt-1 text-gray-500">Phút</span>
          </div>
          <span class="mt-2">:</span>
          <div class="flex flex-col items-center">
            <span class="bg-black text-white w-12 h-12 flex items-center justify-center rounded">{{ timer.seconds }}</span>
            <span class="text-xs font-light mt-1 text-gray-500">Giây</span>
          </div>
        </div>
        <button class="text-sm font-bold underline hover:text-gray-600">Xem tất cả deal ></button>
      </div>
    </section>

    <section class="container mx-auto px-4 py-10" id="shop-section">
      <div class="flex justify-between items-end mb-8">
        <h2 class="text-3xl font-bold tracking-tighter">Sản Phẩm Mới</h2>
        <div class="h-1 w-20 bg-black"></div>
      </div>

      <div class="relative min-h-[400px]">
        <div v-if="isLoading" class="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center transition-all duration-300">
          <div class="text-center">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl text-black"></i>
            <p class="mt-2 text-sm font-bold uppercase tracking-widest text-black">Đang tải...</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 transition-opacity duration-300" :class="{ 'opacity-30 pointer-events-none': isLoading }">
          
          <div v-if="products.length === 0 && !isLoading" class="col-span-full text-center py-10 text-gray-500">
            Chưa có sản phẩm nào.
          </div>

          <div v-for="product in products" :key="product.id" class="group relative border border-gray-100 hover:border-black transition duration-300 bg-white">
            <div class="aspect-[3/4] bg-gray-100 relative overflow-hidden">
              <span v-if="product.status == 1" class="absolute top-2 left-2 bg-black text-white text-[10px] px-2 py-1 uppercase font-bold z-10">New</span>
              
              <img 
                :src="getMainImage(product.image)" 
                alt="Product"
                class="w-full h-full object-cover object-center group-hover:scale-110 transition duration-500"
                @error="$event.target.src = 'https://via.placeholder.com/300x400?text=Error'"
              >

              <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition duration-300 translate-y-4 group-hover:translate-y-0">
                <button class="bg-white text-black w-10 h-10 flex items-center justify-center shadow hover:bg-black hover:text-white transition rounded-full" title="Thêm vào giỏ">
                  <i class="fa-solid fa-cart-plus"></i>
                </button>
                <button class="bg-white text-black w-10 h-10 flex items-center justify-center shadow hover:bg-black hover:text-white transition rounded-full" title="Xem chi tiết">
                  <i class="fa-regular fa-eye"></i>
                </button>
              </div>
            </div>

            <div class="p-4 text-center">
              <h3 class="font-medium text-sm truncate uppercase tracking-wide cursor-pointer hover:underline mb-1">
                {{ product.name }}
              </h3>
              <p class="text-gray-500 text-xs line-clamp-2 mb-2 h-8">{{ product.description }}</p>
              <div class="font-bold text-lg">{{ formatCurrency(product.price) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center mt-12 gap-2" v-if="totalPages > 1">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1 || isLoading" class="w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 transition cursor-pointer">
          <i class="fa-solid fa-chevron-left"></i>
        </button>

        <button v-for="page in totalPages" :key="page" @click="changePage(page)" :disabled="isLoading" 
          :class="['w-10 h-10 border flex items-center justify-center transition font-medium text-sm cursor-pointer', currentPage === page ? 'bg-black text-white border-black' : 'border-gray-300 hover:bg-gray-100']">
          {{ page }}
        </button>

        <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages || isLoading" class="w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 transition cursor-pointer">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </section>

  </div>
</template>

<style scoped>
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.blink-animation { animation: blink 1.5s infinite; }
.animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>