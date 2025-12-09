<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// Import SweetAlert2
import Swal from 'sweetalert2';

const router = useRouter();

// Dữ liệu form
const formData = ref({
  email: '',
  password: '',
  remember: false
});
const isLoading = ref(false);
const errorMsg = ref('');

// --- METHODS ---
// Hàm cấu hình Swal (copy từ Register qua để đồng bộ style)
const showSwal = (icon, title, text) => {
  return Swal.fire({
    icon: icon,
    title: title,
    text: text,
    iconColor: icon === 'success' ? '#000000' : '#d33',
    confirmButtonColor: '#000000',
    confirmButtonText: 'ĐỒNG Ý',
    background: '#ffffff',
    color: '#000000',
    customClass: {
      popup: 'font-inter',
      confirmButton: 'font-bold uppercase tracking-widest px-6 py-3'
    },
    buttonsStyling: true
  });
};

// Hàm xử lý Đăng nhập
const handleLogin = async () => {
  isLoading.value = true;
  errorMsg.value = '';

  try {
    // 1. Gọi API Node.js
    const res = await fetch('http://localhost:8080/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.value.email,
        password: formData.value.password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Đăng nhập thất bại');
    }

    // 2. Lưu thông tin user vào localStorage
    localStorage.setItem('user', JSON.stringify(data.user));

    // 3. Thông báo thành công
    await showSwal('success', 'ĐĂNG NHẬP THÀNH CÔNG', `Chào mừng ${data.user.name} quay trở lại!`);

    // 4. Điều hướng
    if (data.user.role === 'admin') {
      router.push('/admin/products');
    } else {
      router.push('/');
    }

  } catch (err) {
    // Hiện popup lỗi
    showSwal('error', 'ĐĂNG NHẬP THẤT BẠI', err.message);
    errorMsg.value = err.message;
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex font-inter">
    <!-- 1. PHẦN HÌNH ẢNH (Bên Trái) -->
    <div class="hidden lg:flex w-1/2 bg-black relative items-center justify-center overflow-hidden">
      <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div class="z-10 text-center text-white px-10 animate-fade-in-up">
        <div class="mb-6"><i class="fa-solid fa-shield-halved text-6xl"></i></div>
        <h2 class="text-5xl font-bold tracking-tighter mb-4">MONOCHROME</h2>
        <p class="text-gray-400 text-sm tracking-[0.2em] uppercase max-w-md mx-auto leading-7">
          Đẳng cấp đến từ sự tối giản. <br>Đăng nhập để khám phá bộ sưu tập độc quyền.
        </p>
      </div>
      <div class="absolute bottom-8 left-8 text-gray-500 text-xs uppercase tracking-widest">© 2025 BW Store</div>
    </div>

    <!-- 2. PHẦN FORM (Bên Phải) -->
    <div class="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 relative">
      <router-link to="/" class="absolute top-8 right-8 text-gray-400 hover:text-black transition">
        <i class="fa-solid fa-xmark text-2xl"></i>
      </router-link>

      <div class="w-full max-w-md animate-fade-in">
        <div class="text-center mb-10">
          <h1 class="text-3xl font-bold text-black tracking-tight mb-2">Chào mừng trở lại</h1>
          <p class="text-gray-500 text-sm">Vui lòng nhập thông tin để tiếp tục</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Thông báo lỗi -->
          <div v-if="errorMsg" class="bg-red-50 text-red-600 text-sm p-3 border border-red-100 flex items-center gap-2">
            <i class="fa-solid fa-circle-exclamation"></i> {{ errorMsg }}
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><i
                  class="fa-regular fa-envelope"></i></span>
              <input v-model="formData.email" type="email" required
                class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition text-sm"
                placeholder="email@example.com" />
            </div>
          </div>

          <!-- Password -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider">Mật khẩu</label>
              <a href="#" class="text-xs text-black font-medium hover:underline">Quên mật khẩu?</a>
            </div>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><i
                  class="fa-solid fa-lock"></i></span>
              <input v-model="formData.password" type="password" required
                class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition text-sm"
                placeholder="••••••••" />
            </div>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center">
            <input id="remember" type="checkbox" v-model="formData.remember"
              class="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2 accent-black">
            <label for="remember" class="ml-2 text-sm text-gray-600 cursor-pointer select-none">Ghi nhớ đăng
              nhập</label>
          </div>

          <!-- Button -->
          <button type="submit" :disabled="isLoading"
            class="w-full bg-black text-white font-bold text-sm uppercase tracking-widest py-4 hover:bg-gray-800 transition transform hover:-translate-y-1 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
            <i v-if="isLoading" class="fa-solid fa-circle-notch fa-spin"></i>
            {{ isLoading ? 'Đang xử lý...' : 'Đăng Nhập' }}
          </button>
        </form>

        <!-- Divider & Social -->
        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-sm"><span
              class="px-2 bg-white text-gray-400 text-xs uppercase">Hoặc đăng nhập với</span></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <button
            class="flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 transition text-sm font-medium text-gray-700"><i
              class="fa-brands fa-google text-red-500"></i> Google</button>
          <button
            class="flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 transition text-sm font-medium text-gray-700"><i
              class="fa-brands fa-facebook text-blue-600"></i> Facebook</button>
        </div>

        <p class="mt-8 text-center text-sm text-gray-500">
          Chưa có tài khoản?
          <router-link to="/register" class="font-bold text-black hover:underline ml-1">Đăng ký ngay</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>