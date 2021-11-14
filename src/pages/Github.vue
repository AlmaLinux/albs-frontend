<template>
  <div/>
</template>

<script>
import { defineComponent } from 'vue';

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
        this.$store.commit('users/updateSelf', response.data)
        this.$router.push('/')
      })
      // TODO: make a nice error here in UI
      .catch((response) => {
        console.log('Where was an error while was making request', response)
        this.$router.push('/')
      })
  }
})
</script>
