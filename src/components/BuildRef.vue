<template>
  <span :class="cssClass">
    <span>
      {{ text }}
      <q-badge
        v-if="show_cas && is_cas_authenticated !== null"
        color="white"
        align="bottom"
        class="cursor-pointer"
      >
        <q-icon
          v-if="is_cas_authenticated"
          size="xs"
          name="key"
          color="primary"
          @click="copyToClipboard(cas_hash)"
        >
          <q-tooltip class="text-center">
            {{ cas_hash }} <br />
            (click to copy)
          </q-tooltip>
        </q-icon>
        <q-icon v-else size="xs" name="key_off" color="negative">
          <q-tooltip> Source is not authenticated or notarized </q-tooltip>
        </q-icon>
      </q-badge> </span
    ><br />
    <span>{{ isTagOrBranch }}</span>
    <a v-if="hasUrl" :href="refUrl" target="_blank">
      {{ refText }}
      <q-tooltip v-if="hasTooltip" class="text-body2">
        {{ refTooltip }}
      </q-tooltip>
    </a>
    <span v-else>
      {{ refText }}
      <q-tooltip v-if="hasTooltip" class="text-body2">
        {{ refTooltip }}
      </q-tooltip>
    </span>
  </span>
</template>

<script>
  import {QTooltip} from 'quasar'
  import {defineComponent} from 'vue'
  import {BuildTaskRefType} from '../constants'
  import {buildRefText, splitRpmFileName, copyToClipboard} from '../utils'

  // Max length for build tasks refs
  const maxLengthRef = 20

  export default defineComponent({
    name: 'BuildRef',
    props: {
      buildRef: {type: Object, required: true},
      cssClass: {type: String, default: 'text-tertiary'},
      show_cas: Boolean,
      is_cas_authenticated: Boolean,
      cas_hash: String,
    },
    computed: {
      hasTooltip() {
        let gitRef = this.buildRef.git_ref
        let refUrl = decodeURIComponent(this.buildRef.url)
        if (refUrl.includes('.src.rpm') && !this.buildRef.ref_type) {
          return refUrl
        }
        return gitRef && gitRef.length >= maxLengthRef ? true : false
      },
      refTooltip() {
        return buildRefText(this.buildRef)
      },
      isTagOrBranch() {
        switch (this.buildRef.ref_type) {
          case BuildTaskRefType.GIT_BRANCH:
            return `⎇ `
          case BuildTaskRefType.GIT_TAG:
            return `# `
          default:
            return ``
        }
      },
      refText() {
        let ref = buildRefText(this.buildRef)
        return ref && ref.length >= maxLengthRef
          ? ref.slice(0, 17) + '...'
          : ref
      },
      hasUrl() {
        switch (this.buildRef.ref_type) {
          case BuildTaskRefType.GIT_TAG:
            return true
          case BuildTaskRefType.GIT_BRANCH:
            return true
          case BuildTaskRefType.SRPM_URL:
            return true
          default:
            return false
        }
      },
      refUrl() {
        let url = ''
        let refUrl = decodeURIComponent(this.buildRef.url)
        let pkgUrl = refUrl ? refUrl.replace(/\.git$/, '') : ''
        switch (this.buildRef.ref_type) {
          case BuildTaskRefType.SRPM_URL:
            return refUrl
          case BuildTaskRefType.GIT_BRANCH:
            return `${pkgUrl}/src/branch/${this.buildRef.git_ref}`
          case BuildTaskRefType.GIT_TAG:
            return `${pkgUrl}/src/tag/${this.buildRef.git_ref}`
          default:
            return url
        }
      },
      text() {
        let refUrl = decodeURIComponent(this.buildRef.url)
        switch (this.buildRef.ref_type) {
          case BuildTaskRefType.SRPM_URL:
            const pkgInfo = splitRpmFileName(refUrl)
            return pkgInfo ? `${pkgInfo.name}` : refUrl
          default:
            if (refUrl.includes('.src.rpm')) {
              const pkgInfo = splitRpmFileName(refUrl)
              return pkgInfo ? `${pkgInfo.name}` : refUrl
            }
            return refUrl
              .split('/')
              .pop()
              .replace(/\.git$/, '')
        }
      },
    },
    components: {
      QTooltip,
    },
    methods: {
      copyToClipboard: copyToClipboard,
    },
  })
</script>

<style scoped>
  .ref-link-white a:any-link {
    color: white;
  }
</style>
