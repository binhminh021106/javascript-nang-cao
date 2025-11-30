<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-white text-black relative overflow-hidden">
    
    <!-- 1. Background Pattern (Giống trang chủ nhưng mờ hơn) -->
    <div class="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

    <!-- 2. Nội dung chính -->
    <div class="z-10 text-center px-4 animate-fade-in-up">
      <!-- Số 404 khổng lồ -->
      <h1 class="text-[10rem] md:text-[15rem] font-black leading-none tracking-tighter select-none opacity-90">
        404
      </h1>

      <!-- Dòng thông báo -->
      <div class="space-y-4 mb-10 relative">
        <h2 class="text-xl md:text-2xl font-bold uppercase tracking-[0.2em]">
          Lạc lối trong phong cách?
        </h2>
        <p class="text-gray-500 max-w-md mx-auto font-light">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển đi nơi khác. Đừng lo, hãy quay lại trang chủ để tìm cảm hứng mới.
        </p>
        
        <!-- Đường gạch trang trí -->
        <div class="w-16 h-1 bg-black mx-auto mt-6"></div>
      </div>

      <!-- Nút quay về (Style đồng bộ) -->
      <div class="flex flex-col md:flex-row gap-4 justify-center">
        <router-link 
          to="/" 
          class="bg-black text-white px-8 py-3 uppercase font-bold text-xs tracking-widest hover:bg-white hover:text-black border border-black transition transform hover:-translate-y-1 shadow-lg"
        >
          Về Trang Chủ
        </router-link>

        <button 
          @click="$router.go(-1)" 
          class="bg-white text-black px-8 py-3 uppercase font-bold text-xs tracking-widest hover:bg-gray-100 border border-black transition transform hover:-translate-y-1"
        >
          Quay Lại
        </button>
      </div>
    </div>

    <!-- Footer trang trí nhỏ ở đáy -->
    <div class="absolute bottom-10 text-gray-300 text-xs tracking-widest uppercase">
      BW Store • Error Page
    </div>

  </div>
</template>

<script setup>
// Không cần logic phức tạp, chỉ cần template
</script>

<style scoped>
/* Hiệu ứng xuất hiện dần nhẹ nhàng */
.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>