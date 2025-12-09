<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const router = useRouter();
const cartItems = ref([]);
const isLoading = ref(false);

const userStr = localStorage.getItem('user_info') || localStorage.getItem('user');
const user = userStr ? JSON.parse(userStr) : null;

// --- COMPUTED ---
const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.cart_quantity), 0);
});

const shippingFee = computed(() => {
  if (subtotal.value === 0) return 0;
  if (subtotal.value > 1000000) return 0;
  return 30000;
});

const total = computed(() => {
  return subtotal.value + shippingFee.value;
});

// --- METHODS ---
const getImageUrl = (imgStr) => {
  if (!imgStr) return 'https://placehold.co/300x300?text=No+Image';
  if (imgStr.startsWith('http')) return imgStr;
  return `http://localhost:8080/uploads/${imgStr}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const fetchCart = async () => {
  if (!user) {
    router.push('/login');
    return;
  }
  isLoading.value = true;
  try {
    const res = await fetch(`http://localhost:8080/api/cart/${user.id}`);
    if (res.ok) {
      cartItems.value = await res.json();
    }
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

const updateQuantity = async (item, change) => {
  const currentStock = item.product_stock !== undefined ? item.product_stock : 999;
  const newQty = item.cart_quantity + change;

  if (newQty < 1) {
    removeItem(item.cart_id);
    return;
  }

  if (newQty > currentStock) {
    Swal.fire({
      icon: 'warning',
      title: 'Đạt giới hạn',
      text: `Sản phẩm này chỉ còn ${currentStock} cái trong kho!`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000
    });
    return;
  }

  item.cart_quantity = newQty;

  try {
    await fetch(`http://localhost:8080/api/cart/${item.cart_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty })
    });
  } catch (e) {
    console.error("Lỗi cập nhật server");
    item.cart_quantity -= change;
  }
};

const removeItem = async (cartId) => {
  const result = await Swal.fire({
    title: 'Xóa sản phẩm?',
    text: "Bạn muốn xóa sản phẩm này khỏi giỏ?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#000',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy'
  });

  if (result.isConfirmed) {
    try {
      await fetch(`http://localhost:8080/api/cart/${cartId}`, { method: 'DELETE' });
      cartItems.value = cartItems.value.filter(i => i.cart_id !== cartId);
      Swal.fire({ icon: 'success', title: 'Đã xóa!', showConfirmButton: false, timer: 1000 });
    } catch (e) {
      Swal.fire('Lỗi', 'Không thể xóa', 'error');
    }
  }
};

const goToCheckout = () => {
  if (cartItems.value.length === 0) return Swal.fire('Giỏ hàng trống', 'Vui lòng thêm sản phẩm', 'info');
  // Chuyển sang trang checkout
  router.push('/checkout');
};

onMounted(() => {
  fetchCart();
});
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

      <!-- LOADING -->
      <div v-if="isLoading" class="text-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-black mx-auto"></div>
      </div>

      <!-- GIỎ HÀNG TRỐNG -->
      <div v-else-if="cartItems.length === 0" class="text-center py-20">
        <div class="mb-6">
          <i class="fa-solid fa-bag-shopping text-6xl text-gray-200"></i>
        </div>
        <h2 class="text-xl font-bold text-black mb-2">Giỏ hàng của bạn đang trống</h2>
        <p class="text-gray-500 mb-8">Hãy chọn thêm sản phẩm để mua sắm nhé</p>
        <button @click="router.push('/shop')"
          class="bg-black text-white px-8 py-3 uppercase font-bold text-xs tracking-widest hover:bg-gray-800 transition">
          Quay lại cửa hàng
        </button>
      </div>

      <!-- CÓ SẢN PHẨM -->
      <div v-else class="flex flex-col lg:flex-row gap-12">

        <!-- 1. LIST SẢN PHẨM -->
        <div class="w-full lg:w-2/3">

          <div
            class="hidden md:grid grid-cols-12 gap-4 border-b border-black pb-4 mb-6 text-xs font-bold uppercase tracking-widest text-gray-500">
            <div class="col-span-5">Sản phẩm</div>
            <div class="col-span-2 text-center">Giá</div>
            <div class="col-span-2 text-center">Số lượng</div>
            <div class="col-span-2 text-right">Tạm tính</div>
            <div class="col-span-1 text-center">Xóa</div>
          </div>

          <div class="space-y-6 md:space-y-0">
            <div v-for="item in cartItems" :key="item.cart_id"
              class="flex flex-col md:grid md:grid-cols-12 gap-4 items-center border-b border-gray-100 pb-6 md:py-6 last:border-0 relative">

              <div class="col-span-5 flex items-center gap-4 w-full">
                <div class="w-20 h-24 bg-gray-100 flex-shrink-0 relative">
                  <img :src="getImageUrl(item.image)" class="w-full h-full object-cover">
                </div>
                <div>
                  <p class="text-xs text-gray-400 uppercase mb-1">{{ item.category_name || 'Khác' }}</p>
                  <h3 @click="router.push(`/product/${item.product_id}`)"
                    class="font-bold text-sm text-black hover:underline cursor-pointer">{{ item.name }}</h3>

                  <p v-if="item.product_stock !== undefined && item.product_stock < 5"
                    class="text-[10px] text-red-500 mt-1 italic">
                    Chỉ còn {{ item.product_stock }} sp
                  </p>
                </div>
              </div>

              <div class="col-span-2 text-center w-full flex justify-between md:block md:w-auto">
                <span class="md:hidden text-sm text-gray-500">Đơn giá:</span>
                <span class="font-medium text-sm">{{ formatCurrency(item.price) }}</span>
              </div>

              <div class="col-span-2 flex justify-center w-full md:w-auto">
                <div class="flex items-center border border-gray-300 h-8">
                  <button @click="updateQuantity(item, -1)"
                    class="w-8 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600 transition text-xs"><i
                      class="fa-solid fa-minus"></i></button>
                  <input type="text" :value="item.cart_quantity" readonly
                    class="w-10 h-full text-center outline-none bg-transparent font-bold text-xs text-black border-none pointer-events-none">
                  <button @click="updateQuantity(item, 1)"
                    :disabled="item.product_stock !== undefined && item.cart_quantity >= item.product_stock"
                    class="w-8 h-full flex items-center justify-center hover:bg-gray-100 text-gray-600 transition text-xs disabled:opacity-50"><i
                      class="fa-solid fa-plus"></i></button>
                </div>
              </div>

              <div class="col-span-2 text-right w-full flex justify-between md:block md:w-auto">
                <span class="md:hidden text-sm text-gray-500">Thành tiền:</span>
                <span class="font-bold text-sm text-black">{{ formatCurrency(item.price * item.cart_quantity) }}</span>
              </div>

              <div class="col-span-1 hidden md:flex justify-center">
                <button @click="removeItem(item.cart_id)"
                  class="text-gray-400 hover:text-red-600 transition-colors p-2"><i
                    class="fa-solid fa-trash-can text-lg"></i></button>
              </div>
              <button @click="removeItem(item.cart_id)"
                class="md:hidden absolute top-0 right-0 p-2 text-gray-400 hover:text-red-600"><i
                  class="fa-solid fa-trash-can"></i></button>

            </div>
          </div>

          <div class="mt-8 flex justify-between items-center">
            <button @click="router.push('/shop')"
              class="flex items-center gap-2 text-xs font-bold uppercase hover:text-gray-600 transition">
              <i class="fa-solid fa-arrow-left-long"></i> Tiếp tục mua sắm
            </button>
          </div>
        </div>

        <!-- 2. SUMMARY -->
        <div class="w-full lg:w-1/3">
          <div class="bg-gray-50 p-8 border border-gray-200 sticky top-24">
            <h3 class="font-black text-lg uppercase tracking-tighter mb-6 border-b border-gray-200 pb-4">Tổng Đơn Hàng
            </h3>

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
            </div>

            <div class="border-t border-black pt-4 mb-8">
              <div class="flex justify-between items-end">
                <span class="font-bold text-base uppercase">Tổng cộng</span>
                <span class="font-black text-2xl tracking-tight">{{ formatCurrency(total) }}</span>
              </div>
              <p class="text-xs text-gray-500 mt-2 text-right">(Đã bao gồm VAT)</p>
            </div>

            <button @click="goToCheckout"
              class="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black border border-black transition duration-300 shadow-lg">
              Tiến hành thanh toán
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>