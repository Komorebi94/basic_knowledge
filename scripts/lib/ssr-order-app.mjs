import { createApp, createSSRApp, h, ref } from 'vue';

export function parseOrderState(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input) ||
      typeof input.id !== 'string' || !/^[A-Z]$/.test(input.id) ||
      typeof input.title !== 'string' || input.title.length > 80 ||
      !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 5) {
    throw new TypeError('订单初始状态不符合合同');
  }
  return { id: input.id, title: input.title, quantity: input.quantity };
}

export function serializeOrderState(input) {
  return JSON.stringify(parseOrderState(input)).replace(/</g, '\\u003c');
}

export function createOrderApp(input, hydrate = true) {
  const initial = parseOrderState(input);
  const quantity = ref(initial.quantity);
  const component = {
    setup() {
      return () => h('main', [
        h('h1', initial.title),
        h('button', {
          type: 'button',
          onClick: () => { quantity.value = Math.min(quantity.value + 1, 5); }
        }, '数量:' + quantity.value)
      ]);
    }
  };
  return { app: (hydrate ? createSSRApp : createApp)(component), quantity };
}
