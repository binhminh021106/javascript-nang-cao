<template>
  <div class="user-layout font-inter bg-white text-black min-h-screen flex flex-col">

    <!-- === HEADER === -->
    <header class="border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur z-50">
      <div class="container mx-auto px-6 h-20 flex items-center justify-between">

        <!-- 1. LOGO -->
        <div class="w-1/6">
          <router-link to="/" class="text-2xl font-bold tracking-tighter uppercase no-underline text-black">
            BW<span class="font-light">Store</span>
          </router-link>
        </div>

        <!-- 2. MENU + SEARCH (Desktop) -->
        <div class="hidden md:flex flex-1 justify-center items-center gap-8">
          <nav class="flex gap-8 text-sm font-medium uppercase tracking-wide">
            <router-link to="/" class="nav-link">Trang Chủ</router-link>
            <router-link to="/shop" class="nav-link">Cửa Hàng</router-link>
            <router-link to="/collection" class="nav-link text-gray-400 hover:text-black">Bộ Sưu Tập</router-link>
          </nav>

          <div class="h-4 w-px bg-gray-300"></div>

          <div class="relative group">
            <input type="text" placeholder="Tìm kiếm..."
              class="pl-3 pr-8 py-1.5 border-b border-gray-300 focus:border-black outline-none bg-transparent text-sm w-48 transition-all focus:w-64 placeholder-gray-400">
            <button class="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-black">
              <i class="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>
        </div>

        <!-- 3. USER ACTIONS -->
        <div class="w-1/6 flex justify-end items-center gap-6">
          <router-link to="/wishlist" class="relative group" title="Yêu thích">
            <i class="fa-regular fa-heart text-xl text-black hover:text-gray-600 transition"></i>
            <span
              class="absolute -top-1 -right-2 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">3</span>
          </router-link>

          <router-link to="/cart" class="relative group" title="Giỏ hàng">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
              stroke="currentColor" class="w-6 h-6 text-black group-hover:text-gray-600 transition">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span
              class="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </router-link>

          <router-link to="/login" class="relative group" title="Tài khoản">
            <i class="fa-regular fa-user text-xl text-black hover:text-gray-600 transition"></i>
          </router-link>

          <!-- Mobile Menu Button -->
          <button @click="toggleMenu" class="md:hidden text-2xl ml-2 text-black">
            <i class="fa-solid fa-bars"></i>
          </button>
        </div>
      </div>

      <!-- Mobile Menu Dropdown -->
      <transition name="slide-fade">
        <div v-if="isMenuOpen" class="md:hidden border-t border-gray-100 p-6 bg-white absolute w-full shadow-lg z-40">
          <nav class="flex flex-col gap-4 text-center">
            <router-link to="/" class="font-medium hover:bg-gray-50 py-2 text-black no-underline"
              @click="toggleMenu">Trang Chủ</router-link>
            <router-link to="/shop" class="font-medium hover:bg-gray-50 py-2 text-black no-underline"
              @click="toggleMenu">Cửa Hàng</router-link>
            <div class="relative w-full mt-2">
              <input type="text" placeholder="Tìm kiếm sản phẩm..."
                class="w-full border border-gray-300 p-2 rounded text-sm outline-none">
              <i class="fa-solid fa-magnifying-glass absolute right-3 top-3 text-gray-400"></i>
            </div>
          </nav>
        </div>
      </transition>
    </header>

    <!-- === MAIN CONTENT (Router View) === -->
    <main class="flex-grow">
      <!-- Đây là nơi nội dung các trang con (Home, Shop, About...) sẽ hiển thị -->
      <router-view />
    </main>

    <!-- === FOOTER === -->
    <footer class="bg-black text-white pt-20 pb-10 mt-auto">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          <!-- Cột 1 -->
          <div class="space-y-6">
            <h2 class="text-3xl font-bold tracking-tighter">BW<span class="font-light text-gray-400">Store</span></h2>
            <p class="text-gray-400 text-sm leading-7 pr-4">
              Thương hiệu thời trang tối giản dành cho những người yêu thích sự tinh tế.
            </p>
            <div class="flex gap-4">
              <a href="#" class="social-icon"><i class="fa-brands fa-facebook-f"></i></a>
              <a href="#" class="social-icon"><i class="fa-brands fa-instagram"></i></a>
              <a href="#" class="social-icon"><i class="fa-brands fa-tiktok"></i></a>
            </div>
          </div>

          <!-- Cột 2 -->
          <div>
            <h3 class="footer-heading">Khám Phá</h3>
            <ul class="space-y-4 text-sm text-gray-400">
              <li><router-link to="/shop/men" class="footer-link">Thời Trang Nam</router-link></li>
              <li><router-link to="/shop/women" class="footer-link">Thời Trang Nữ</router-link></li>
              <li><router-link to="/shop/accessories" class="footer-link">Phụ Kiện</router-link></li>
            </ul>
          </div>

          <!-- Cột 3 -->
          <div>
            <h3 class="footer-heading">Hỗ Trợ</h3>
            <ul class="space-y-4 text-sm text-gray-400">
              <li><router-link to="/policy" class="footer-link">Chính sách đổi trả</router-link></li>
              <li><router-link to="/size-guide" class="footer-link">Hướng dẫn chọn size</router-link></li>
              <li><router-link to="/contact" class="footer-link">Liên hệ</router-link></li>
            </ul>
          </div>

          <!-- Cột 4 -->
          <div>
            <h3 class="footer-heading">Đăng Ký Tin</h3>
            <div class="space-y-4 text-sm text-gray-400">
              <p class="mb-2 text-white font-medium">Nhận ưu đãi mới nhất:</p>
              <form @submit.prevent class="flex">
                <input type="email" placeholder="Email..."
                  class="bg-gray-900 text-white px-4 py-2 w-full outline-none focus:bg-gray-800 text-xs">
                <button class="bg-white text-black px-4 font-bold hover:bg-gray-200 uppercase text-xs">Gửi</button>
              </form>
            </div>
          </div>
        </div>

        <div
          class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; 2024 BW Store. All rights reserved.</p>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref } from 'vue';

// State quản lý menu mobile
const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};
</script>

<style scoped>
/* Import font Inter nếu chưa có trong index.html của project */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.user-layout {
  font-family: 'Inter', sans-serif;
}

/* Custom CSS cho các hiệu ứng hover không có sẵn trong Tailwind utility cơ bản */
.nav-link {
  position: relative;
  text-decoration: none;
  color: black;
}

.nav-link::after {
  content: '';
  position: absolute;
  width: 0;
  height: 1px;
  bottom: -2px;
  left: 0;
  background-color: black;
  transition: width 0.3s ease;
}

.nav-link:hover::after {
  width: 100%;
}

/* Footer styles custom */
.footer-heading {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.footer-link {
  transition: all 0.3s;
  text-decoration: none;
  color: #9ca3af;
  /* gray-400 */
}

.footer-link:hover {
  color: white;
  padding-left: 0.5rem;
}

.social-icon {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid #374151;
  /* gray-700 */
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: white;
  text-decoration: none;
}

.social-icon:hover {
  background-color: white;
  color: black;
  border-color: white;
}

/* Transitions cho Vue <transition> */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>