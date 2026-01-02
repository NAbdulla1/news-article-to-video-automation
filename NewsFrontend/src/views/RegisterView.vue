<template>
  <div class="register-container">
    <n-card title="Register" style="max-width: 400px; margin: auto; margin-top: 50px;">
      <n-form ref="formRef" :model="form" :rules="rules">
        <n-form-item label="Username" path="username">
            <n-input v-model:value="form.username" placeholder="Username" />
        </n-form-item>
        <n-form-item label="First Name" path="firstName">
            <n-input v-model:value="form.firstName" placeholder="First Name" />
        </n-form-item>
        <n-form-item label="Last Name" path="lastName">
            <n-input v-model:value="form.lastName" placeholder="Last Name" />
        </n-form-item>
        <n-form-item label="Email" path="email">
            <n-input v-model:value="form.email" placeholder="Email" />
        </n-form-item>
        <n-form-item label="Password" path="password">
          <n-input
            v-model:value="form.password"
            type="password"
            show-password-on="click"
            placeholder="Password"
          />
        </n-form-item>
        <n-button type="primary" block @click="handleRegister" :loading="loading">
          Register
        </n-button>
      </n-form>
      <div style="margin-top: 10px; text-align: center;">
          <n-button text @click="goToLogin">Already have an account? Login</n-button>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { authService } from '../services/authService';
import * as keycloakService from '../services/keycloakService';

const formRef = ref(null);
const message = useMessage();
const router = useRouter();
const loading = ref(false);

const form = ref({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
});

const rules = {
    username: { required: true, message: 'Please input username', trigger: 'blur' },
    email: { required: true, message: 'Please input email', trigger: 'blur' },
    password: { required: true, message: 'Please input password', trigger: 'blur' }
};

const handleRegister = async () => {
    loading.value = true;
    try {
        await authService.register(form.value);
        message.success('Registration successful. Please login.');
        keycloakService.login();
    } catch (error: any) {
        // Handle error message
        const err = error.response?.data?.error || 'Registration failed';
        message.error(err);
    } finally {
        loading.value = false;
    }
};

const goToLogin = () => {
    keycloakService.login();
};
</script>

<style scoped>
.register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
}
</style>
