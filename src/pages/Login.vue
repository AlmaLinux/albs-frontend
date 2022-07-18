<template>
  <div class="flex flex-center login-button">
    <q-btn
        round
        flat
        :icon="fabGithub"
        text="Login with github"
        @click="githubLogin"
        size="64px"
    >
    </q-btn>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { fabGithub } from '@quasar/extras/fontawesome-v5';

export default defineComponent({
  name: 'LoginPage',

  setup (props) {
    return {
      fabGithub
    }
  },

  methods: {
    githubLogin () {
      this.$api.get('/auth/github/authorize')
        .then((response) => {
          window.location.href = response.data.authorization_url
        })
    }
  }
})
</script>

<style>
  .login-button{
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -50px;
    margin-left: -50px;
  }
</style>
