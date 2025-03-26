<template>
  <div class="row justify-center q-col-gutter-sm q-ma-xs q-pl-xl">
    <div style="width: 95%">
      <q-card v-if="release">
        <q-card-section horizontal class="row items-start">
          <q-card-section class="col q-pt-lg">
            <div class="text-subtitle2">
              Created by
              <a :href="`mailto:${release.owner.email}`">
                {{ release.owner.username }}
              </a>
              <br />
              <p v-if="release.created_at">
                at {{ createdAt(release.created_at) }}
              </p>
            </div>
          </q-card-section>
          <q-card-section class="col q-pl-xl text-center">
            <div class="text-h6">Release {{ release.id }}</div>
            <q-chip
              align="top"
              dense
              :color="releaseStatus.color[release.status]"
              class="text-weight-bolder text-white text-capitalize"
            >
              {{ statusText(releaseStatus.text[release.status]) }}
            </q-chip>
          </q-card-section>
          <q-card-section class="col q-pt-lg text-center">
            <div class="row justify-end q-gutter-lg">
              <div>
                <b>Platform:&nbsp;</b> <br />
                <span> {{ release.platform.name }} <br /> </span>
              </div>
              <div>
                <b>Product:&nbsp;</b> <br />
                <router-link :to="{path: `/product/${release.product.id}`}">
                  {{ release.product.name }}
                </router-link>
              </div>
            </div>
          </q-card-section>
        </q-card-section>
        <q-card-section>
          <release-view :release="release" />
        </q-card-section>
        <div v-if="showActions()">
          <q-separator />
          <q-card-actions class="row justify-end q-gutter-sm q-pr-sm">
            <q-btn
              v-if="release.status === releaseStatus.COMPLETED"
              color="negative"
              round
              icon="replay"
              @click="confirm = true"
            >
              <q-tooltip> Revert release </q-tooltip>
            </q-btn>
            <q-btn
              v-if="release.status === releaseStatus.SCHEDULED"
              color="primary"
              icon="navigate_next"
              round
              @click.stop
              :to="{path: `/release/${releaseId}/update`}"
            >
              <q-tooltip> Continue Release </q-tooltip>
            </q-btn>
          </q-card-actions>
        </div>
      </q-card>
    </div>
  </div>
  <q-dialog v-model="confirm" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <span class="text-h6">Warning</span>
      </q-card-section>
      <q-card-section>
        Are you sure you want to revert release {{ releaseId }}?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          label="Confirm"
          color="primary"
          v-close-popup
          @click="revertRelease(releaseId)"
        />
        <q-btn
          flat
          label="Cancel"
          color="negative"
          v-close-popup
          @click="confirm = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
      import { Loading, Notify } from 'quasar'
      import { defineComponent, ref } from 'vue'
      import { ReleaseStatus } from 'src/constants'
      import ReleaseView from 'components/ReleaseView.vue'

      export default defineComponent({
      props: {
          releaseId: String
      },
      data() {
        return {
            release: null,
            releaseStatus: ReleaseStatus,
            confirm: false,
            loadingCommit: false
        }
      },
      created () {
        this.loadRelease(this.releaseId)
      },
      methods: {
        userAuthenticated () {
          return this.$store.getters.isAuthenticated
        },
        showActions() {
          return (this.userAuthenticated() &&
          (this.release.status === this.releaseStatus.COMPLETED ||
            this.release.status === this.releaseStatus.SCHEDULED ))
        },
        revertRelease(releaseId) {
          this.$api.post(`/releases/${releaseId}/revert/`).then(() => {
            Notify.create({
              message: `Release ${releaseId} has been queued for revert`,
              type: 'positive',
              actions: [
                { label: 'Dismiss', color: 'white', handler: () => {} }
              ]
            })
          }).catch(error => {
            Notify.create({
              message: error.response.data.detail,
              type: 'negative',
              timeout: 30,
              actions: [
                { label: 'Dismiss', color: 'white', handler: () => {} }
              ]
            })
          })
        },
        createdAt (date) {
            if (!date) return 'no date'

            return new Date(date).toLocaleString()
        },
        statusText(text) {
            return text.replace("release ","")
        },
        loadRelease (releaseId) {
            Loading.show()
            this.$api.get(`/releases/${releaseId}/`)
                .then(response => {
                    Loading.hide()
                    this.release = response.data
                })
                .catch(error => {
                    Loading.hide()
                    if (+String(error.response.status)[0] === 4 ){
                        Notify.create({
                            message: error.response.data.detail, type: 'negative',
                            actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]
                        })
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
        },
        commitRelease () {
            this.loadingCommit = true
            this.$api.post(`/releases/${this.release.id}/commit/`)
                .then(response => {
                    this.loadingCommit = false
                    Notify.create({message: response.data.message, type: 'positive',
                        actions: [{ label: 'Dismiss', color: 'white', handler: () => {} }]})
                    this.$router.push(`/release-feed`)
                })
                .catch(error => {
                    this.loadingCommit = false
                    console.log(error)
                    Notify.create({
                        message: `${error.response.status}: ${error.response.statusText}`,
                        type: 'negative',
                        actions: [
                            { label: 'Dismiss', color: 'white', handler: () => {} }
                        ]
                    })
                })
        },
      },
      components: {
          ReleaseView
      }
  })
</script>

<style></style>
