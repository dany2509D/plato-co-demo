import { store } from '../core/app-store.js';
import { createCart } from './cart.js';

export const cart = createCart(store);
