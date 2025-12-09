<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// Import SweetAlert2
import Swal from 'sweetalert2';

const router = useRouter();

// --- STATE ---
const formData = ref({
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agree: false
});

const isLoading = ref(false);
const errorMsg = ref('');

// --- METHODS ---
// Hàm cấu hình chung cho Swal để đồng bộ style Monochrome
const showSwal = (icon, title, text) => {
  return Swal.fire({
    icon: icon,
    title: title,
    text: text,
    // Tùy chỉnh màu sắc cho hợp theme đen trắng
    iconColor: icon === 'success' ? '#000000' : '#d33', // Thành công màu đen, lỗi giữ đỏ hoặc đen tùy bạn
    confirmButtonColor: '#000000', // Nút xác nhận màu đen
    confirmButtonText: 'ĐỒNG Ý',
    background: '#ffffff',
    color: '#000000',
    // Thêm class để chỉnh font và bỏ bo tròn nếu muốn
    customClass: {
      popup: 'font-inter', // Dùng font của web
      confirmButton: 'font-bold uppercase tracking-widest px-6 py-3' // Style giống nút Login
    },
    buttonsStyling: true
  });
};

const handleRegister = async () => {
  isLoading.value = true;
  errorMsg.value = '';

  // 1. Validate cơ bản
  if (!formData.value.fullName || !formData.value.email || !formData.value.phone || !formData.value.password) {
    errorMsg.value = 'Vui lòng điền đầy đủ thông tin bắt buộc!';
    isLoading.value = false;
    return;
  }

  // 2. Kiểm tra mật khẩu trùng khớp
  if (formData.value.password !== formData.value.confirmPassword) {
    errorMsg.value = 'Mật khẩu xác nhận không khớp!';
    isLoading.value = false;
    return;
  }

  // 3. Kiểm tra điều khoản
  if (!formData.value.agree) {
    // Dùng Swal cho cảnh báo này luôn cho đẹp
    showSwal('warning', 'CHÚ Ý', 'Bạn phải đồng ý với điều khoản dịch vụ!');
    isLoading.value = false;
    return;
  }

  try {
    // 4. GỌI API THỰC TẾ
    const res = await fetch('http://localhost:8080/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Map dữ liệu từ form sang tên cột trong DB
        name: formData.value.fullName, 
        email: formData.value.email,
        phone: formData.value.phone,
        password: formData.value.password
      })
    });

    const data = await res.json();

    // Nếu server trả về lỗi (ví dụ: Email đã tồn tại)
    if (!res.ok) {
      throw new Error(data.error || 'Đăng ký thất bại');
    }

    // --- THÀNH CÔNG ---
    // Thay alert() bằng Swal
    await showSwal('success', 'ĐĂNG KÝ THÀNH CÔNG', 'Chào mừng bạn đến với Monochrome. Vui lòng đăng nhập để tiếp tục.');
    
    // Chuyển hướng sau khi user bấm OK
    router.push('/login');

  } catch (err) {
    // --- LỖI API ---
    // Hiển thị Swal lỗi
    showSwal('error', 'CÓ LỖI XẢY RA', err.message);
    // Vẫn set errorMsg để hiện text đỏ nhỏ ở form nếu muốn
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
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      <!-- Nội dung trang trí -->
      <div class="z-10 text-center text-white px-10 animate-fade-in-up">
        <div class="mb-6">
           <i class="fa-solid fa-shield-halved text-6xl"></i>
        </div>
        <h2 class="text-5xl font-bold tracking-tighter mb-4">MONOCHROME</h2>
        <p class="text-gray-400 text-sm tracking-[0.2em] uppercase max-w-md mx-auto leading-7">
          Gia nhập cộng đồng của chúng tôi. <br>Trải nghiệm mua sắm đẳng cấp và khác biệt.
        </p>
      </div>

      <div class="absolute bottom-8 left-8 text-gray-500 text-xs uppercase tracking-widest">
        © 2025 BW Store
      </div>
    </div>

    <!-- 2. PHẦN FORM (Bên Phải) -->
    <div class="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-8 relative overflow-y-auto">
      
      <!-- Nút về trang chủ -->
      <router-link to="/" class="absolute top-8 right-8 text-gray-400 hover:text-black transition z-10">
        <i class="fa-solid fa-xmark text-2xl"></i>
      </router-link>

      <div class="w-full max-w-md py-10 animate-fade-in">
        
        <!-- Header Form -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-black tracking-tight mb-2">Tạo tài khoản mới</h1>
          <p class="text-gray-500 text-sm">Điền thông tin bên dưới để đăng ký</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleRegister" class="space-y-5">
          
          <!-- Thông báo lỗi -->
          <div v-if="errorMsg" class="bg-red-50 text-red-600 text-sm p-3 border border-red-100 flex items-center gap-2 rounded">
            <i class="fa-solid fa-circle-exclamation"></i> {{ errorMsg }}
          </div>

          <!-- Họ và tên -->
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Họ và tên <span class="text-red-500">*</span></label>
            <input 
              v-model="formData.fullName"
              type="text" 
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition text-sm rounded-none"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <!-- Email & Số điện thoại (2 cột) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email <span class="text-red-500">*</span></label>
              <input 
                v-model="formData.email"
                type="email" 
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition text-sm"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Số điện thoại <span class="text-red-500">*</span></label>
              <input 
                v-model="formData.phone"
                type="tel" 
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition text-sm"
                placeholder="0912..."
              />
            </div>
          </div>

          <!-- Mật khẩu -->
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mật khẩu <span class="text-red-500">*</span></label>
            <div class="relative">
              <input 
                v-model="formData.password"
                type="password" 
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <!-- Xác nhận mật khẩu -->
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Xác nhận mật khẩu <span class="text-red-500">*</span></label>
            <div class="relative">
              <input 
                v-model="formData.confirmPassword"
                type="password" 
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition text-sm"
                placeholder="Nhập lại mật khẩu"
              />
            </div>
          </div>

          <!-- Điều khoản -->
          <div class="flex items-start pt-2">
            <input 
              id="agree" 
              type="checkbox" 
              v-model="formData.agree"
              class="mt-1 w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2 accent-black cursor-pointer"
            >
            <label for="agree" class="ml-2 text-sm text-gray-600 cursor-pointer select-none leading-relaxed">
              Tôi đồng ý với <a href="#" class="text-black font-bold hover:underline">Điều khoản dịch vụ</a> và <a href="#" class="text-black font-bold hover:underline">Chính sách bảo mật</a> của BW Store.
            </label>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full bg-black text-white font-bold text-sm uppercase tracking-widest py-4 hover:bg-gray-800 transition transform hover:-translate-y-1 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
          >
            <i v-if="isLoading" class="fa-solid fa-circle-notch fa-spin"></i>
            {{ isLoading ? 'Đang xử lý...' : 'Đăng Ký Ngay' }}
          </button>
        </form>

        <!-- Login Link -->
        <p class="mt-8 text-center text-sm text-gray-500">
          Đã có tài khoản? 
          <router-link to="/login" class="font-bold text-black hover:underline ml-1">Đăng nhập</router-link>
        </p>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* Animation */
.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}
.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>