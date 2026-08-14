<template>
  <q-dialog v-model="show">
    <q-card style="width: 400px" v-if="build">
      <q-card-section>
        <div class="text-h6">Sign build {{ build.id }}</div>
      </q-card-section>
      <q-form @submit="signBuild">
        <q-card-section>
          <q-select
            v-model="current_sign"
            label="Choose PGP key"
            :rules="[(val) => !!val || 'PGP key is required']"
            :options="existingKeys"
            :loading="keysLoad"
            id="sbd-qs-key"
          />
          <span v-if="preselectedKeyName" class="text-caption text-grey-7">
            Pre-selected default key: {{ preselectedKeyName }}
          </span>
          <span v-if="!testingCompleted" class="text-negative">
            <br />
            <b>Warning:</b> the build testing is not finished yet. Are you sure
            you want to sign it?
          </span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            text-color="primary"
            label="Sign"
            style="width: 150px"
            :loading="loading"
            type="submit"
            id="sbd-qb-sign"
          />
          <q-btn
            flat
            text-color="negative"
            label="Cancel"
            v-close-popup
            @click="current_sign = null"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
  import {defineComponent} from 'vue'
  import {Notify} from 'quasar'
  import {defaultSignKey, isBuildTestingCompleted} from '../utils'

  export default defineComponent({
    name: 'sign-build-dialog',
    emits: ['signed'],
    data() {
      return {
        show: false,
        build: null,
        current_sign: null,
        preselectedKeyName: null,
        loading: false,
        keysLoad: false,
      }
    },
    computed: {
      existingKeys() {
        return this.$store.state.keys.keys.map((key) => {
          return {label: key.name, value: key.id}
        })
      },
      testingCompleted() {
        return isBuildTestingCompleted(this.build)
      },
    },
    methods: {
      open(build) {
        this.build = build
        this.current_sign = null
        this.preselectedKeyName = null
        this.show = true
        if (this.$store.state.keys.keys.length) {
          this.applyDefaultKey()
          return
        }
        this.keysLoad = true
        this.$store.dispatch('keys/loadKeysList').finally(() => {
          this.keysLoad = false
          this.applyDefaultKey()
        })
      },
      applyDefaultKey() {
        let key = defaultSignKey(this.build, this.$store.state.keys.keys)
        if (!key) {
          return
        }
        this.current_sign = {label: key.name, value: key.id}
        this.preselectedKeyName = key.name
      },
      signBuild() {
        this.loading = true
        let buildId = this.build.id
        let request_body = {
          build_id: buildId,
          sign_key_id: this.current_sign.value,
        }
        this.$api
          .post('/sign-tasks/', request_body)
          .then((response) => {
            this.loading = false
            this.show = false
            this.current_sign = null
            this.$emit('signed', {buildId: buildId, signTask: response.data})
            Notify.create({
              message: `Build ${buildId} is queued for signing`,
              type: 'positive',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
          .catch((error) => {
            this.loading = false
            Notify.create({
              message: error.response.data.detail,
              type: 'negative',
              actions: [{label: 'Dismiss', color: 'white', handler: () => {}}],
            })
          })
      },
    },
  })
</script>
