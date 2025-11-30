<script setup>
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// --- STATE ---

// 1. Thông tin khách hàng (Giả lập đã login thì điền sẵn)
const customerInfo = reactive({
  fullName: 'Nguyễn Văn A', // Giả sử lấy từ User Info
  email: 'nguyenvana@example.com',
  phone: '0912345678',
  address: '',
  city: '',
  note: ''
});

// 2. Sản phẩm trong giỏ (Mock Data - Lấy từ Cart Store)
const orderItems = ref([
  {
    id: 1,
    name: 'ÁO THUN REGULAR FIT',
    size: 'L',
    price: 350000,
    quantity: 2,
    image: 'https://placehold.co/150x150/f3f4f6/000000?text=Ao+Thun'
  },
  {
    id: 2,
    name: 'QUẦN TÂY ỐNG ĐỨNG',
    size: '31',
    price: 550000,
    quantity: 1,
    image: 'https://placehold.co/150x150/f3f4f6/000000?text=Quan+Tay'
  }
]);

// 3. Phương thức thanh toán
const paymentMethod = ref('cod'); // Mặc định COD

// --- COMPUTED ---
const subtotal = computed(() => {
  return orderItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const shippingFee = computed(() => {
  return subtotal.value > 1000000 ? 0 : 30000;
});

const total = computed(() => {
  return subtotal.value + shippingFee.value;
});

// --- METHODS ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const handleOrder = () => {
  // Validate cơ bản
  if (!customerInfo.address || !customerInfo.city) {
    alert('Vui lòng điền đầy đủ địa chỉ giao hàng!');
    return;
  }

  if (paymentMethod.value === 'vnpay') {
    alert('Đang chuyển hướng sang cổng thanh toán VNPAY...');
    // Logic redirect VNPAY ở đây
  } else {
    alert('Đặt hàng thành công! Mã đơn hàng: #BW-' + Math.floor(Math.random() * 10000));
    router.push('/'); // Về trang chủ hoặc trang Success
  }
};
</script>

<template>
  <div class="checkout-page bg-white min-h-screen pb-20">
    
    <!-- Header Page -->
    <div class="bg-gray-50 border-b border-gray-200 py-8 mb-8">
      <div class="container mx-auto px-6 text-center">
        <h1 class="text-2xl font-black tracking-tighter uppercase mb-1">Thanh Toán</h1>
        <div class="text-xs text-gray-500 uppercase tracking-widest flex justify-center gap-2">
          <span class="text-gray-400">Giỏ hàng</span>
          <i class="fa-solid fa-chevron-right text-[10px] mt-0.5"></i>
          <span class="text-black font-bold">Thanh toán</span>
          <i class="fa-solid fa-chevron-right text-[10px] mt-0.5"></i>
          <span class="text-gray-400">Hoàn tất</span>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-6">
      <form @submit.prevent="handleOrder" class="flex flex-col lg:flex-row gap-12">
        
        <!-- === CỘT TRÁI: THÔNG TIN & THANH TOÁN === -->
        <div class="w-full lg:w-3/5 space-y-10">
          
          <!-- 1. Thông tin giao hàng -->
          <div>
            <h3 class="text-sm font-bold uppercase tracking-widest mb-6 border-l-4 border-black pl-3">
              Thông tin giao hàng
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Họ tên -->
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Họ và tên</label>
                <input v-model="customerInfo.fullName" type="text" class="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black transition bg-white" placeholder="Nhập họ tên người nhận">
              </div>

              <!-- Email -->
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                <input v-model="customerInfo.email" type="email" class="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black transition bg-white" placeholder="email@example.com">
              </div>

              <!-- SĐT -->
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Số điện thoại</label>
                <input v-model="customerInfo.phone" type="tel" class="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black transition bg-white" placeholder="09xxxxxxxx">
              </div>

              <!-- Tỉnh/Thành -->
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Tỉnh / Thành phố</label>
                <select v-model="customerInfo.city" class="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black transition bg-white">
                  <option value="" disabled>Chọn tỉnh thành</option>
                  <option value="HCM">Hồ Chí Minh</option>
                  <option value="HN">Hà Nội</option>
                  <option value="DN">Đà Nẵng</option>
                  <option value="DL">Đắk Lắk</option>
                </select>
              </div>

              <!-- Địa chỉ -->
              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Địa chỉ cụ thể</label>
                <input v-model="customerInfo.address" type="text" class="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black transition bg-white" placeholder="Số nhà, tên đường...">
              </div>

              <!-- Ghi chú -->
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Ghi chú đơn hàng (Tùy chọn)</label>
                <textarea v-model="customerInfo.note" rows="3" class="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black transition bg-white" placeholder="Ví dụ: Giao hàng giờ hành chính..."></textarea>
              </div>
            </div>
          </div>

          <!-- 2. Phương thức thanh toán -->
          <div>
            <h3 class="text-sm font-bold uppercase tracking-widest mb-6 border-l-4 border-black pl-3">
              Phương thức thanh toán
            </h3>

            <div class="space-y-4">
              <!-- Option COD -->
              <label 
                class="flex items-center justify-between p-4 border cursor-pointer transition hover:bg-gray-50"
                :class="paymentMethod === 'cod' ? 'border-black ring-1 ring-black' : 'border-gray-300'"
              >
                <div class="flex items-center gap-4">
                  <input type="radio" value="cod" v-model="paymentMethod" class="w-5 h-5 accent-black">
                  <div>
                    <p class="font-bold text-sm uppercase">Thanh toán khi nhận hàng (COD)</p>
                    <p class="text-xs text-gray-500 mt-1">Bạn chỉ phải thanh toán khi nhận được hàng.</p>
                  </div>
                </div>
                <i class="fa-solid fa-money-bill-wave text-gray-400 text-xl"></i>
              </label>

              <!-- Option VNPAY -->
              <label 
                class="flex items-center justify-between p-4 border cursor-pointer transition hover:bg-gray-50"
                :class="paymentMethod === 'vnpay' ? 'border-black ring-1 ring-black' : 'border-gray-300'"
              >
                <div class="flex items-center gap-4">
                  <input type="radio" value="vnpay" v-model="paymentMethod" class="w-5 h-5 accent-black">
                  <div>
                    <p class="font-bold text-sm uppercase text-blue-700">Thanh toán qua VNPAY</p>
                    <p class="text-xs text-gray-500 mt-1">Quét mã QR hoặc dùng thẻ ATM/Visa nội địa.</p>
                  </div>
                </div>
                <img src="https://thuonghieumanh.vneconomy.vn/upload/vnpay.png" alt="VNPAY" class="h-6 object-contain">
              </label>
            </div>
          </div>

        </div>

        <!-- === CỘT PHẢI: TÓM TẮT ĐƠN HÀNG === -->
        <div class="w-full lg:w-2/5">
          <div class="bg-gray-50 p-8 border border-gray-200 sticky top-24">
            <h3 class="font-black text-lg uppercase tracking-tighter mb-6">Đơn hàng của bạn</h3>

            <!-- List sản phẩm -->
            <div class="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="item in orderItems" :key="item.id" class="flex gap-4 items-center">
                <div class="relative w-16 h-16 bg-white border border-gray-200 flex-shrink-0">
                  <img :src="item.image" class="w-full h-full object-cover p-1">
                  <span class="absolute -top-2 -right-2 bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {{ item.quantity }}
                  </span>
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-bold text-black line-clamp-1">{{ item.name }}</h4>
                  <p class="text-xs text-gray-500">Size: {{ item.size }}</p>
                </div>
                <div class="text-sm font-bold text-black">
                  {{ formatCurrency(item.price * item.quantity) }}
                </div>
              </div>
            </div>

            <hr class="border-gray-200 my-6">

            <!-- Tính tiền -->
            <div class="space-y-3 mb-6 text-sm">
              <div class="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span class="font-medium text-black">{{ formatCurrency(subtotal) }}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span v-if="shippingFee === 0" class="text-green-600 font-bold text-xs uppercase">Miễn phí</span>
                <span v-else class="font-medium text-black">{{ formatCurrency(shippingFee) }}</span>
              </div>
            </div>

            <hr class="border-gray-200 my-6">

            <div class="flex justify-between items-end mb-8">
              <span class="font-bold text-base uppercase">Tổng cộng</span>
              <div class="text-right">
                <span class="text-xs text-gray-400 font-normal">VND</span>
                <span class="font-black text-2xl tracking-tight ml-1">{{ formatCurrency(total) }}</span>
              </div>
            </div>

            <button 
              class="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black border border-black transition duration-300 shadow-lg flex justify-center items-center gap-2"
            >
              <span>Đặt hàng ngay</span>
              <i class="fa-solid fa-arrow-right-long"></i>
            </button>

            <div class="mt-4 text-center">
              <router-link to="/cart" class="text-xs text-gray-500 underline hover:text-black">Quay lại giỏ hàng</router-link>
            </div>

          </div>
        </div>

      </form>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar cho list sản phẩm nếu dài */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #ccc; 
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #aaa; 
}
</style>