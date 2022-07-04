<template>
  <div/>
</template>

<script>
import { defineComponent } from 'vue'
import { LocalStorage, Notify } from 'quasar'

export default defineComponent({
  name: 'Github-page',
  props: {
    code: {
      type: String,
      required: true
    }
  },
  created () {
    const params = {
      code: this.$props.code
    }
    this.$api.post('/users/login/github', params)
      .then((response) => {
        let redirectPath = LocalStorage.getItem('redirectPath')
        this.$store.commit('users/updateSelf', response.data)
        this.$router.push(redirectPath)
      })
      // TODO: make a nice error here in UI
      .catch((error) => {
        Notify.create({
            message: `${error.response.status}: ${error.response.statusText}`,
            type: 'negative',
            actions: [
                { label: 'Dismiss', color: 'white', handler: () => {} }
            ]
        })
        console.log('Where was an error while was making request', error)
        this.$router.push('/')
      })
  }
})
</script>
