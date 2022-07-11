<template>
  <div/>
</template>

<script>
import { defineComponent } from 'vue'
import { Cookies, LocalStorage } from 'quasar'
import { parseJwt } from '../utils'

export default defineComponent({
  name: 'PostLogin-page',
  
  created () {
    let token = Cookies.get('albs')
    let user = {
      user_id: parseJwt(token).user_id,
      jwt_token: token
    }
    this.$store.commit('users/updateSelf', user)
    let redirectPath = LocalStorage.getItem('redirectPath')
    if (redirectPath.startsWith('/auth')) redirectPath = '/'

    this.$router.push(redirectPath)
  }
})
</script>
