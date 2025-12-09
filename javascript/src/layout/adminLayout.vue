<template>
  <div class="flex h-screen bg-gray-50 font-inter text-gray-800">

    <!-- === SIDEBAR (Desktop) === -->
    <aside class="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm z-10">

      <!-- Logo Area -->
      <div class="h-16 flex items-center px-6 border-b border-gray-100">
        <a href="/" class="flex items-center gap-2 text-xl font-bold tracking-tighter text-black no-underline">
          <i class="fa-solid fa-shield-halved text-black"></i>
          BW<span class="font-light text-gray-500">Admin</span>
        </a>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-6 space-y-1">

        <p class="px-6 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quản lý</p>

        <router-link :to="{ name: 'AdminProducts' }"
          class="flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:text-black transition-colors relative group"
          active-class="bg-gray-100 !text-black border-r-4 border-black">
          <i
            class="fa-solid fa-box-open w-6 text-center mr-2 text-gray-400 group-hover:text-black group-[.router-link-active]:text-black transition-colors"></i>
          Sản phẩm
        </router-link>

        <router-link :to="{ name: 'AdminCategories' }"
          class="flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:text-black transition-colors relative group"
          active-class="bg-gray-100 !text-black border-r-4 border-black">
          <i
            class="fa-solid fa-layer-group w-6 text-center mr-2 text-gray-400 group-hover:text-black group-[.router-link-active]:text-black transition-colors"></i>
          Danh mục
        </router-link>

        <!-- MỚI: QUẢN LÝ ĐƠN HÀNG -->
        <router-link :to="{ name: 'AdminOrders' }"
          class="flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:text-black transition-colors relative group"
          active-class="bg-gray-100 !text-black border-r-4 border-black">
          <i
            class="fa-solid fa-file-invoice-dollar w-6 text-center mr-2 text-gray-400 group-hover:text-black group-[.router-link-active]:text-black transition-colors"></i>
          Đơn hàng
        </router-link>

        <a href="#"
          class="flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors group">
          <i
            class="fa-solid fa-chart-pie w-6 text-center mr-2 text-gray-400 group-hover:text-black transition-colors"></i>
          Báo cáo doanh thu
        </a>

        <div class="my-4 border-t border-gray-100 mx-6"></div>

        <p class="px-6 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hệ thống</p>

        <a href="#"
          class="flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-colors group">
          <i class="fa-solid fa-gear w-6 text-center mr-2 text-gray-400 group-hover:text-black transition-colors"></i>
          Cài đặt
        </a>
      </nav>

      <!-- User Profile (Bottom Sidebar) -->
      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=000&color=fff" alt="Admin"
            class="w-9 h-9 rounded-full border border-gray-200">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-black truncate">Admin User</p>
            <p class="text-xs text-gray-500 truncate">super@admin.com</p>
          </div>
          <i class="fa-solid fa-chevron-right text-xs text-gray-300"></i>
        </div>
      </div>
    </aside>

    <!-- === MAIN CONTENT === -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- Header -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-10">

        <!-- Left: Mobile Toggle & Breadcrumb -->
        <div class="flex items-center gap-4">
          <button @click="isSidebarOpen = !isSidebarOpen" class="md:hidden text-gray-500 hover:text-black">
            <i class="fa-solid fa-bars text-xl"></i>
          </button>

          <nav class="hidden md:flex text-sm text-gray-500">
            <span>Admin</span>
            <span class="mx-2">/</span>
            <span class="font-semibold text-black">Dashboard</span>
          </nav>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-4">
          <button class="relative p-2 text-gray-400 hover:text-black transition">
            <i class="fa-regular fa-bell"></i>
            <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>

          <button
            class="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-black transition">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span class="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      <!-- Main Scrollable Area -->
      <main class="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
        <div class="max-w-7xl mx-auto">
          <!-- Router View sẽ hiển thị nội dung trang con ở đây -->
          <router-view></router-view>
        </div>
      </main>

    </div>

    <!-- === MOBILE SIDEBAR OVERLAY === -->
    <div v-if="isSidebarOpen" class="fixed inset-0 z-40 flex md:hidden">
      <!-- Backdrop -->
      <div @click="isSidebarOpen = false" class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"></div>

      <!-- Sidebar Mobile -->
      <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white h-full shadow-2xl animate-slide-in">
        <div class="absolute top-0 right-0 -mr-12 pt-4">
          <button @click="isSidebarOpen = false"
            class="flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
            <i class="fa-solid fa-xmark text-white text-xl"></i>
          </button>
        </div>

        <div class="h-16 flex items-center px-6 border-b border-gray-100">
          <span class="text-xl font-bold">Menu</span>
        </div>

        <!-- Mobile Nav Links -->
        <nav class="flex-1 py-6 px-4 space-y-2">

          <router-link :to="{ name: 'AdminProducts' }" @click="isSidebarOpen = false"
            class="flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black font-medium"
            active-class="bg-gray-100 !text-black">
            <i class="fa-solid fa-box-open w-6 mr-2"></i> Sản phẩm
          </router-link>

          <router-link :to="{ name: 'AdminCategories' }" @click="isSidebarOpen = false"
            class="flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black font-medium"
            active-class="bg-gray-100 !text-black">
            <i class="fa-solid fa-layer-group w-6 mr-2"></i> Danh mục
          </router-link>

          <!-- MOBILE ORDER LINK -->
          <router-link :to="{ name: 'AdminOrders' }" @click="isSidebarOpen = false"
            class="flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black font-medium"
            active-class="bg-gray-100 !text-black">
            <i class="fa-solid fa-file-invoice-dollar w-6 mr-2"></i> Đơn hàng
          </router-link>

          <router-link :to="{ name: 'AdminUsers' }" @click="isSidebarOpen = false"
            class="flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-black font-medium"
            active-class="bg-gray-100 !text-black">
            <i class="fa-solid fa-users w-6 mr-2"></i> Khách hàng
          </router-link>

        </nav>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';

const isSidebarOpen = ref(false);
</script>

<style scoped>
/* Hiệu ứng trượt cho mobile menu */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out forwards;
}

/* Custom scrollbar cho đẹp */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>