<template>
  <div />
</template>

<script>
  import {defineComponent} from 'vue'
  import {Cookies, LocalStorage, Notify} from 'quasar'
  import {parseJwt} from '../utils'

  export default defineComponent({
    name: 'PostLogin-page',

    created() {
      let token = Cookies.get('albs')
      try {
        let parsedToken = parseJwt(token)
        let user = {
          user_id: parsedToken.sub,
          jwt_token: token,
        }
        this.$store.commit('users/updateSelf', user)
        let redirectPath = LocalStorage.getItem('redirectPath')
        if (redirectPath.startsWith('/auth')) redirectPath = '/'

        this.$store.dispatch('users/setIsAdmin').then((isAdmin) => {
          this.$router.push(redirectPath)
        })
      } catch (err) {
        console.log(err)
        Notify.create({
          message: 'Authorization error: Invalid JWT',
          type: 'negative',
          actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
        })
        this.$router.push('/')
      }
    },
  })
</script>
