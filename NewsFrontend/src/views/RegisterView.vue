<template>
  <div class="register-container">
    <n-card title="Register" style="max-width: 400px; margin: auto; margin-top: 50px;">
      <n-form ref="formRef" :model="form" :rules="rules">
        <n-form-item label="Username" path="username" :validation-status="fieldErrors.username ? 'error' : undefined" :feedback="fieldErrors.username">
            <n-input v-model:value="form.username" placeholder="Username" @update:value="fieldErrors.username = ''" />
        </n-form-item>
        <n-form-item label="First Name" path="firstName" :validation-status="fieldErrors.firstName ? 'error' : undefined" :feedback="fieldErrors.firstName">
            <n-input v-model:value="form.firstName" placeholder="First Name" @update:value="fieldErrors.firstName = ''" />
        </n-form-item>
        <n-form-item label="Last Name" path="lastName" :validation-status="fieldErrors.lastName ? 'error' : undefined" :feedback="fieldErrors.lastName">
            <n-input v-model:value="form.lastName" placeholder="Last Name" @update:value="fieldErrors.lastName = ''" />
        </n-form-item>
        <n-form-item label="Email" path="email" :validation-status="fieldErrors.email ? 'error' : undefined" :feedback="fieldErrors.email">
            <n-input v-model:value="form.email" placeholder="Email" @update:value="fieldErrors.email = ''" />
        </n-form-item>
        <n-form-item label="Password" path="password" :validation-status="fieldErrors.password ? 'error' : undefined" :feedback="fieldErrors.password">
          <n-input
            v-model:value="form.password"
            type="password"
            show-password-on="click"
            placeholder="Password"
            @update:value="fieldErrors.password = ''"
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

const fieldErrors = ref<Record<string, string>>({});

const rules = {
    username: { required: true, message: 'Please input username', trigger: 'blur' },
    email: { required: true, message: 'Please input email', trigger: 'blur' },
    password: { required: true, message: 'Please input password', trigger: 'blur' }
};

const handleRegister = async () => {
    loading.value = true;
    fieldErrors.value = {}; // Reset errors
    try {
        await authService.register(form.value);
        message.success('Registration successful. Please login.');
        keycloakService.login();
    } catch (error: any) {
        console.log('Register Error Response:', error.response?.data);
        // Handle error message
        const data = error.response?.data;
        if (data?.details) {
             // Handle Zod validation errors
             data.details.forEach((err: any) => {
                 const field = err.path[0];
                 if (field) {
                     fieldErrors.value[field] = err.message;
                 }
             });
             message.error("Please fix the errors in the form.");
        } else {
             const err = data?.error || 'Registration failed';
             message.error(err);
        }
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
