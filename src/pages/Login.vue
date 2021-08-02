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
      window.location.href = this.makeGithubAuthURL()
    },
    makeGithubAuthURL () {
      const baseUrl = 'https://github.com/login/oauth/authorize'
      const params = new URLSearchParams({
        // TODO: move to config
        client_id: 'e8c7ea050080aa97d5ee',
        scope: 'read:user,user:email'
      })
      return `${baseUrl}?${params.toString()}`
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
