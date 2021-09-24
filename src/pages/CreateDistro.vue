<template>
  <div class="row no-wrap justify-center vertical-middle layout-padding">
    <q-card style="min-width: 40vw;" flat bordered>
      <q-card-section>
        <div class="text-h6">Create new distribution</div>
      </q-card-section>
      <q-card-section>
        <q-input v-model="newDistro.name" clearable
                 style="min-width: 250px; max-width: 300px"
                 hint="Enter name of new distribution"
                 :error="name_error" :error-message="error_msg"
                 label="Distribution name"/>
        <q-select v-model="newDistro.platforms"
                  multiple use-chips clearable
                  style="min-width: 250px; max-width: 300px"
                  :options="platforms"
                  label="Create from platform">
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label v-html="scope.opt.label" />
                <q-item-label caption>{{ scope.opt.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn color="secondary" style="width: 150px;" @click="createNewDistro"
               :loading="loading" label="Create">
          <template v-slot:loading>
            <q-spinner-hourglass class="on-left" />
              Loading...
          </template>
        </q-btn>
      </q-card-actions>
    </q-card>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import {Loading, Notify} from "quasar"

export default defineComponent({
  name: "CreateDistro",
  data () {
    return {
      newDistro: {
        platforms: [],
        name: '',
      },
      loading: false,
      existing_distro: false,
      name_error: false,
      error_msg: ''
    }
  },
  computed: {
    platforms () {
      return this.$store.state.platforms.platforms.map(platform => {
        return {label: platform.name, value: platform.name, description: platform.arch_list.join(', ')}
      })
    }
  },
  methods: {
    createNewDistro () {
      this.loading = true
      this.newDistro.platforms = this.newDistro.platforms.map(item => item.value)
      this.$api.post('/distro/', this.newDistro)
        .then(() => {
          this.loading = false
          Notify.create({
            message: `Distribution ${this.newDistro.name} has been created`,
            type: 'positive', actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]
          })
          this.newDistro.name = ''
          this.newDistro.platforms = []
        })
        .catch(error => {
          this.loading = false
          Notify.create({
            message: error.response.data.detail, type: 'negative',
            actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]
          })
          this.error_msg = 'Already exists'
          this.name_error = true
        })
    }
  }
})
</script>

<style scoped>

</style>
