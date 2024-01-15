<template>
  <div class="container-fluid absolute-center">
    <div class="row">
      <div class="col-md-12">
        <h5 class="text-center">
          Please select the service you want to use to log into ALBS
        </h5>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6" style="display: grid">
        <q-btn
          flat
          text="Login with AlmaLinux Accounts"
          @click="almalinuxLogin"
        >
          <q-icon class="text-dark" size="250px">
            <img
              src="~assets/almalinux-logo.png"
              alt="Login using your AlmaLinux account"
            />
          </q-icon>
        </q-btn>
      </div>

      <div class="col-md-6" style="display: grid">
        <q-btn flat text="Login with your Github profile" @click="githubLogin">
          <q-icon class="text-dark" size="250px">
            <img
              src="~assets/github-mark.svg"
              alt="Login using your Github profile"
            />
          </q-icon>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script>
  import {defineComponent} from 'vue'
  import {fabGithub} from '@quasar/extras/fontawesome-v5'

  export default defineComponent({
    name: 'LoginPage',

    setup(props) {
      return {
        fabGithub,
      }
    },

    methods: {
      githubLogin() {
        this.$api.get('/auth/github/authorize').then((response) => {
          window.location.href = response.data.authorization_url
        })
      },
      almalinuxLogin() {
        this.$api.get('/auth/almalinux/authorize').then((response) => {
          window.location.href = response.data.authorization_url
        })
      },
    },
  })
</script>

<style>
  .login-button {
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -50px;
    margin-left: -50px;
  }

  .login-box {
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -50px;
    margin-left: -50px;
  }
</style>
