<template>
  <div class="q-pa-md">
    <package-location-selection-form ref="packageLocationSelectionForm" />
  </div>
</template>

<script>
  import {defineComponent} from 'vue'
  import PackageLocationSelectionForm from 'components/PackageLocationSelectionForm.vue'
  import {Notify} from 'quasar'
  import {useRoute} from 'vue-router'

  export default defineComponent({
    created() {
      this.createRelease()
    },
    methods: {
      createRelease() {
        const route = useRoute()
        let data = JSON.parse(route.query.requestBody)
        this.$api
          .post(`/releases/new/`, data)
          .then((response) => {
            this.$refs.packageLocationSelectionForm.createTable(response.data)
          })
          .catch((error) => {
            Notify.create({
              message: `${error.response.status}: ${error.response.statusText}`,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
            this.$router.go(-1)
          })
      },
    },
    components: {
      PackageLocationSelectionForm,
    },
  })
</script>
