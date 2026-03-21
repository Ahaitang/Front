// #ifndef VUE3
import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
const store = new Vuex.Store({
// #endif

// #ifdef VUE3
import { createStore } from 'vuex'
const store = createStore({
// #endif
	state: {
		hasLogin: false,
		userInfo: null,
		role: ''
	},
	mutations: {
		login(state, { userInfo, role }) {
			state.hasLogin = true;
			state.userInfo = userInfo;
			state.role = role;
		},
		logout(state) {
			state.hasLogin = false;
			state.userInfo = null;
			state.role = '';
		},
		setUserInfo(state, userInfo) {
			state.userInfo = userInfo;
		}
	},
	getters: {
		isLogin: state => state.hasLogin,
		currentUser: state => state.userInfo,
		currentRole: state => state.role
	}
})

export default store