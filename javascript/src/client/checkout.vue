<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const router = useRouter();
const cartItems = ref([]);
const isLoading = ref(false);

const userStr = localStorage.getItem('user_info') || localStorage.getItem('user');
const user = userStr ? JSON.parse(userStr) : null;

// --- STATE FORM ---
const customerInfo = reactive({
  fullName: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  address: '',
  city: '',
  note: ''
});

const paymentMethod = ref('cod');

// --- COMPUTED ---
const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.cart_quantity), 0);
});

const shippingFee = computed(() => {
  if (subtotal.value === 0) return 0;
  return subtotal.value > 1000000 ? 0 : 30000;
});

const total = computed(() => {
  return subtotal.value + shippingFee.value;
});

// --- METHODS ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const getImageUrl = (imgStr) => {
    if (!imgStr) return 'https://placehold.co/300x300?text=No+Image';
    if (imgStr.startsWith('http')) return imgStr;
    return `http://localhost:8080/uploads/${imgStr}`;
};

// 1. Fetch giỏ hàng thật từ API
const fetchCart = async () => {
    if (!user) {
        router.push('/login');
        return;
    }
    isLoading.value = true;
    try {
        const res = await fetch(`http://localhost:8080/api/cart/${user.id}`);
        if(res.ok) {
            cartItems.value = await res.json();
            // Nếu giỏ rỗng thì đá về Shop
            if (cartItems.value.length === 0) {
                 Swal.fire('Giỏ hàng trống', 'Vui lòng chọn sản phẩm trước', 'info');
                 router.push('/shop');
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        isLoading.value = false;
    }
};

// 2. Xử lý đặt hàng (Gọi API Checkout)
const handleOrder = async () => {
  if (!customerInfo.fullName || !customerInfo.phone || !customerInfo.address || !customerInfo.city) {
    Swal.fire('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin giao hàng!', 'warning');
    return;
  }

  const fullAddress = `${customerInfo.address}, ${customerInfo.city}`;
  const payload = {
    user_id: user.id,
    customer_name: customerInfo.fullName,
    customer_phone: customerInfo.phone,
    customer_address: fullAddress,
    items: cartItems.value,
    total_money: total.value
  };

  try {
      Swal.fire({ title: 'Đang xử lý...', didOpen: () => Swal.showLoading() });
      
      const res = await fetch('http://localhost:8080/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      const data = await res.json();

      if(res.ok) {
          Swal.fire({
              icon: 'success',
              title: 'Đặt hàng thành công!',
              text: `Mã đơn hàng: #${data.orderId}`,
              confirmButtonText: 'Tiếp tục mua sắm',
              confirmButtonColor: '#000'
          }).then(() => {
              router.push('/shop'); 
          });
      } else {
          Swal.fire('Lỗi', data.error || 'Có lỗi xảy ra', 'error');
      }

  } catch (error) {
      console.error(error);
      Swal.fire('Lỗi', 'Không kết nối được server', 'error');
  }
};

onMounted(() => {
    fetchCart();
});
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
       <!-- Loading -->
       <div v-if="isLoading" class="text-center py-10">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-black mx-auto"></div>
       </div>

      <form v-else @submit.prevent="handleOrder" class="flex flex-col lg:flex-row gap-12 animate-fade-in">
        
        <!-- === CỘT TRÁI: THÔNG TIN === -->
        <div class="w-full lg:w-3/5 space-y-10">
          
          <!-- 1. Thông tin giao hàng -->
          <div>
            <h3 class="text-sm font-bold uppercase tracking-widest mb-6 border-l-4 border-black pl-3">
              Thông tin giao hàng
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Họ và tên <span class="text-red-500">*</span></label>
                <input v-model="customerInfo.fullName" type="text" class="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black transition bg-white" placeholder="Nhập họ tên người nhận">
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
                <input v-model="customerInfo.email" type="email" class="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black transition bg-white" placeholder="email@example.com">
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Số điện thoại <span class="text-red-500">*</span></label>
                <input v-model="customerInfo.phone" type="tel" class="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black transition bg-white" placeholder="09xxxxxxxx">
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Tỉnh / Thành phố <span class="text-red-500">*</span></label>
                <select v-model="customerInfo.city" class="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black transition bg-white">
                  <option value="" disabled>Chọn tỉnh thành</option>
                  <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                  <option value="Hải Phòng">Hải Phòng</option>
                  <option value="Khác">Khác (Tỉnh lẻ)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Địa chỉ cụ thể <span class="text-red-500">*</span></label>
                <input v-model="customerInfo.address" type="text" class="w-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black transition bg-white" placeholder="Số nhà, tên đường...">
              </div>

              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Ghi chú (Tùy chọn)</label>
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
              <label class="flex items-center justify-between p-4 border border-black ring-1 ring-black cursor-pointer bg-gray-50">
                <div class="flex items-center gap-4">
                  <input type="radio" value="cod" checked readonly class="w-5 h-5 accent-black">
                  <div>
                    <p class="font-bold text-sm uppercase">Thanh toán khi nhận hàng (COD)</p>
                    <p class="text-xs text-gray-500 mt-1">Bạn chỉ phải thanh toán khi nhận được hàng.</p>
                  </div>
                </div>
                <i class="fa-solid fa-money-bill-wave text-gray-600 text-xl"></i>
              </label>
            </div>
          </div>

        </div>

        <!-- === CỘT PHẢI: TÓM TẮT ĐƠN HÀNG === -->
        <div class="w-full lg:w-2/5">
          <div class="bg-gray-50 p-8 border border-gray-200 sticky top-24">
            <h3 class="font-black text-lg uppercase tracking-tighter mb-6">Đơn hàng của bạn</h3>

            <!-- List sản phẩm (Real Data) -->
            <div class="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="item in cartItems" :key="item.cart_id" class="flex gap-4 items-center">
                <div class="relative w-16 h-16 bg-white border border-gray-200 flex-shrink-0">
                  <img :src="getImageUrl(item.image)" class="w-full h-full object-cover p-1">
                  <span class="absolute -top-2 -right-2 bg-black text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {{ item.cart_quantity }}
                  </span>
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-bold text-black line-clamp-1">{{ item.name }}</h4>
                  <p class="text-xs text-gray-500">{{ item.category_name }}</p>
                </div>
                <div class="text-sm font-bold text-black">
                  {{ formatCurrency(item.price * item.cart_quantity) }}
                </div>
              </div>
            </div>

            <hr class="border-gray-200 my-6">

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
              <span>Xác nhận đặt hàng</span>
              <i class="fa-solid fa-check"></i>
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
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #aaa; }

.animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>