<template>
  <div class="row no-wrap justify-center vertical-middle layout-padding">
    <q-card style="min-width: 50%" bordered>
    <q-form @submit="createNewProduct">
        <q-card-section>
          <div class="text-h6">Create new product</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="product_name" clearable
                    style="max-width: 80%"
                    hint="Enter name of new product*"
                    :rules="[val => nameRule(val) || 'Name is required and cannot contain spaces']"
                    :error="name_error" :error-message="error_msg"
                    label="Product name" />
          <q-input v-model="product_title" clearable
                    style="max-width: 80%"
                    hint="Enter title of new product*"
                    :rules="[val => !!val || 'Title is required']"
                    label="Product title"/>
          <div class="q-pt-md" style="max-width: 80%">
                    <q-input
                      v-model="product_description"
                      type="textarea"
                      hint="Enter description of new product"
                      label="Product description"
                    />
          </div>
          <q-select v-model="product_teams"
                    clearable
                    :options="teams"
                    hint="Select team*"
                    :rules="[val => !!val || 'Team is required']"
                    style="max-width: 80%"
                    label="Create for team" />
          <q-select v-model="product_platforms"
                    multiple use-chips clearable
                    style="max-width: 80%"
                    :options="platforms"
                    option-value="id"
                    option-label="name"
                    hint="Select platforms*"
                    :rules="[val => platformsRule(val) || 'Platforms is required']"
                    label="Create from platforms">
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label v-html="scope.opt.name" />
                  <q-item-label caption>{{ scope.opt.arch_list.join(', ') }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn color="primary" style="width: 30%" type="submit"
                :loading="loading" label="Create" no-caps>
            <template v-slot:loading>
              <q-spinner-hourglass class="on-left" />
                Loading...
            </template>
          </q-btn>
        </q-card-actions>
      </q-form>
    </q-card>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { LocalStorage, Notify } from "quasar"

export default defineComponent({
  name: "CreateProduct",
  data () {
    return {
      product_name: '',
      product_title: '',
      product_description: '',
      product_teams: null,
      product_platforms: [],
      loading: false,
      name_error: false,
      error_msg: '',
      nameRef: null,
      teamRef: null,
      platfotrmsRef: null
    }
  },
  computed: {
    platforms () {
      return this.$store.state.platforms.platforms
    },
    teams () {
      return this.$store.state.teams.teams.map(team => {
        return { label: team.name, value: team.id }
      })
    }
  },
  methods: {
    nameRule (values) {
      return !!values && values.indexOf(' ') < 0
    },
    platformsRule (values) {
      let flag = true
      if (values === null){
        values = []
      }
      if (values.length === 0) {
        flag = false
      }
      return flag
    },
    createNewProduct () {
      this.loading = true
      let user = LocalStorage.getItem('user')
      let data = {
        name: this.product_name,
        team_id: this.product_teams.value,
        owner_id: user.user_id,
        title: this.product_title,
        description: this.product_description,
        platforms: this.product_platforms
      }
      this.$api.post('/products/', data)
        .then(response => {
          this.loading = false
          Notify.create({
            message: `Product ${response.data.name} has been created`,
            type: 'positive', actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]
          })
          this.$router.push('/product-feed')
        })
        .catch(error => {
          this.loading = false
          console.log(error)
          if (+String(error.response.status)[0] === 4){
            Notify.create({
              message: error.response.data.detail, type: 'negative',
              actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]
            })
            if (error.response.data.detail.includes('already exist')){
              this.error_msg = 'Already exists'
              this.name_error = true
            }  
          } else {
            Notify.create({
              message: `${error.response.status}: ${error.response.statusText}`,
              type: 'negative',
              actions: [
                  { label: 'Dismiss', color: 'white', handler: () => {} }
              ]
            })
          }      
        })
    }
  }
})
</script>

<style scoped>

</style>
