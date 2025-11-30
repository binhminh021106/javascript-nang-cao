<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// --- STATE (Mock Data - Giả lập dữ liệu trong giỏ) ---
// Trong thực tế, bạn sẽ lấy dữ liệu này từ Pinia Store hoặc LocalStorage
const cartItems = ref([
  {
    id: 1,
    name: 'ÁO THUN REGULAR FIT',
    category: 'Thời trang nam',
    price: 350000,
    quantity: 2,
    image: 'https://placehold.co/300x300/f3f4f6/000000?text=Ao+Thun'
  },
  {
    id: 2,
    name: 'QUẦN TÂY ỐNG ĐỨNG',
    category: 'Quần nam',
    price: 550000,
    quantity: 1,
    image: 'https://placehold.co/300x300/f3f4f6/000000?text=Quan+Tay'
  },
  {
    id: 3,
    name: 'TÚI TOTE CANVAS',
    category: 'Phụ kiện',
    price: 120000,
    quantity: 1,
    image: 'https://placehold.co/300x300/f3f4f6/000000?text=Tui+Tote'
  }
]);

const promoCode = ref('');

// --- COMPUTED ---

// Tính tổng tiền tạm tính
const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Phí vận chuyển (Miễn phí nếu đơn > 1 triệu)
const shippingFee = computed(() => {
  if (subtotal.value > 1000000) return 0;
  return 30000;
});

// Tổng cộng
const total = computed(() => {
  return subtotal.value + shippingFee.value;
});

// --- METHODS ---

const increaseQty = (id) => {
  const item = cartItems.value.find(i => i.id === id);
  if (item) item.quantity++;
};

const decreaseQty = (id) => {
  const item = cartItems.value.find(i => i.id === id);
  if (item && item.quantity > 1) {
    item.quantity--;
  } else {
    // Nếu giảm về 0 thì hỏi xóa
    removeItem(id);
  }
};

const removeItem = (id) => {
  if (confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
    cartItems.value = cartItems.value.filter(i => i.id !== id);
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const handleCheckout = () => {
  alert('Chức năng thanh toán đang được phát triển!');
  // router.push('/checkout');
};
</script>

<template>
  <div class="cart-page bg-white min-h-screen pb-20">
    
    <!-- Header Page -->
    <div class="bg-gray-50 border-b border-gray-200 py-10 mb-10">
      <div class="container mx-auto px-6 text-center">
        <h1 class="text-3xl font-black tracking-tighter uppercase mb-2">Giỏ Hàng Của Bạn</h1>
        <p class="text-xs text-gray-500 uppercase tracking-widest">
          <span class="font-bold text-black">{{ cartItems.length }}</span> sản phẩm trong giỏ
        </p>
      </div>
    </div>

    <div class="container mx-auto px-6">
      
      <!-- TRƯỜNG HỢP GIỎ HÀNG TRỐNG -->
      <div v-if="cartItems.length === 0" class="text-center py-20">
        <div class="mb-6">
          <i class="fa-solid fa-bag-shopping text-6xl text-gray-200"></i>
        </div>
        <h2 class="text-xl font-bold text-black mb-2">Giỏ hàng của bạn đang trống</h2>
        <p class="text-gray-500 mb-8">Hãy chọn thêm sản phẩm để mua sắm nhé</p>
        <button 
          @click="router.push('/shop')"
          class="bg-black text-white px-8 py-3 uppercase font-bold text-xs tracking-widest hover:bg-gray-800 transition"
        >
          Quay lại cửa hàng
        </button>
      </div>

      <!-- TRƯỜNG HỢP CÓ SẢN PHẨM -->
      <div v-else class="flex flex-col lg:flex-row gap-12">
        
        <!-- 1. LIST SẢN PHẨM (Bên Trái) -->
        <div class="w-full lg:w-2/3">
          
          <!-- Table Header (Desktop only) -->
          <div class="hidden md:grid grid-cols-12 gap-4 border-b border-black pb-4 mb-6 text-xs font-bold uppercase tracking-widest text-gray-500">
            <div class="col-span-6">Sản phẩm</div>
            <div class="col-span-2 text-center">Giá</div>
            <div class="col-span-2 text-center">Số lượng</div>
            <div class="col-span-2 text-right">Tạm tính</div>
          </div>

          <!-- Cart Items -->
          <div class="space-y-6 md:space-y-0">
            <div 
              v-for="item in cartItems" 
              :key="item.id" 
              class="flex flex-col md:grid md:grid-cols-12 gap-4 items-center border-b border-gray-100 pb-6 md:py-6 last:border-0"
            >
              
              <!-- Cột 1: Info -->
              <div class="col-span-6 flex items-center gap-4 w-full">
                <div class="w-20 h-24 bg-gray-100 flex-shrink-0 relative group">
                  <img :src="item.image" class="w-full h-full object-cover">
                  <!-- Nút xóa (Hover mới hiện trên desktop) -->
                  <button 
                    @click="removeItem(item.id)"
                    class="absolute top-0 left-0 bg-black text-white w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                    title="Xóa"
                  >
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <div>
                  <p class="text-xs text-gray-400 uppercase mb-1">{{ item.category }}</p>
                  <h3 
                    @click="router.push(`/product/${item.id}`)"
                    class="font-bold text-sm text-black hover:underline cursor-pointer"
                  >
                    {{ item.name }}
                  </h3>
                  <!-- Mobile Remove Button -->
                  <button @click="removeItem(item.id)" class="md:hidden text-xs text-red-500 mt-2 underline">Xóa</button>
                </div>
              </div>

              <!-- Cột 2: Price -->
              <div class="col-span-2 text-center w-full flex justify-between md:block md:w-auto">
                <span class="md:hidden text-sm text-gray-500">Đơn giá:</span>
                <span class="font-medium text-sm">{{ formatCurrency(item.price) }}</span>
              </div>

              <!-- Cột 3: Quantity -->
              <div class="col-span-2 flex justify-center w-full md:w-auto">
                <div class="flex items-center border border-gray-300 h-8">
                  <button @click="decreaseQty(item.id)" class="w-8 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600 transition text-xs">-</button>
                  <input type="text" :value="item.quantity" readonly class="w-10 h-full text-center outline-none bg-transparent font-bold text-xs text-black">
                  <button @click="increaseQty(item.id)" class="w-8 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600 transition text-xs">+</button>
                </div>
              </div>

              <!-- Cột 4: Total Line -->
              <div class="col-span-2 text-right w-full flex justify-between md:block md:w-auto">
                <span class="md:hidden text-sm text-gray-500">Thành tiền:</span>
                <span class="font-bold text-sm text-black">{{ formatCurrency(item.price * item.quantity) }}</span>
              </div>

            </div>
          </div>

          <!-- Actions Bottom -->
          <div class="mt-8 flex justify-between items-center">
            <button @click="router.push('/shop')" class="flex items-center gap-2 text-xs font-bold uppercase hover:text-gray-600 transition">
              <i class="fa-solid fa-arrow-left-long"></i> Tiếp tục mua sắm
            </button>
          </div>

        </div>

        <!-- 2. ORDER SUMMARY (Bên Phải) -->
        <div class="w-full lg:w-1/3">
          <div class="bg-gray-50 p-8 border border-gray-200 sticky top-24">
            <h3 class="font-black text-lg uppercase tracking-tighter mb-6 border-b border-gray-200 pb-4">Tổng Đơn Hàng</h3>
            
            <div class="space-y-4 mb-6">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Tạm tính</span>
                <span class="font-bold">{{ formatCurrency(subtotal) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Vận chuyển</span>
                <span v-if="shippingFee === 0" class="text-green-600 font-bold text-xs uppercase">Miễn phí</span>
                <span v-else class="font-bold">{{ formatCurrency(shippingFee) }}</span>
              </div>
              <div class="flex justify-between text-sm items-center">
                <span class="text-gray-600">Mã giảm giá</span>
                <span class="text-gray-400 italic text-xs">Chưa áp dụng</span>
              </div>
            </div>

            <!-- Promo Code Input -->
            <div class="mb-6">
              <div class="flex">
                <input 
                  v-model="promoCode"
                  type="text" 
                  placeholder="Mã ưu đãi" 
                  class="w-full border border-gray-300 border-r-0 px-4 py-2 text-xs outline-none focus:border-black uppercase placeholder-normal"
                >
                <button class="bg-black text-white px-4 py-2 text-xs font-bold uppercase hover:bg-gray-800 transition">
                  Áp dụng
                </button>
              </div>
            </div>

            <div class="border-t border-black pt-4 mb-8">
              <div class="flex justify-between items-end">
                <span class="font-bold text-base uppercase">Tổng cộng</span>
                <span class="font-black text-2xl tracking-tight">{{ formatCurrency(total) }}</span>
              </div>
              <p class="text-xs text-gray-500 mt-2 text-right">(Đã bao gồm VAT)</p>
            </div>

            <button 
              @click="handleCheckout"
              class="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black border border-black transition duration-300 shadow-lg"
            >
              Tiến hành thanh toán
            </button>

            <div class="mt-6 text-center space-y-2">
              <p class="text-[10px] text-gray-400 uppercase tracking-wider">Chúng tôi chấp nhận</p>
              <div class="flex justify-center gap-3 text-2xl text-gray-400">
                <i class="fa-brands fa-cc-visa hover:text-black transition"></i>
                <i class="fa-brands fa-cc-mastercard hover:text-black transition"></i>
                <i class="fa-brands fa-cc-paypal hover:text-black transition"></i>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ẩn nút tăng giảm mặc định của input type number nếu có */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
</style>