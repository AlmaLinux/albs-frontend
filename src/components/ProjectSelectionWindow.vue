<template>
  <q-dialog position="top"
            :content-css="{minWidth: '35vw'}"
            v-model="opened">
    <q-card>
      <q-card-section>
        <div class="text-h6">Add a project to the build</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
          <q-option-group v-model="projectType"
                          :options="sourceTypes"
                          type="radio"
                          inline/>

          <template v-if="projectType === 'srpm_url'">
            <q-input v-model="srpmUrl" type="url"/>
          </template>

          <template v-if="projectType === 'git_ref'">
            <q-input v-model="git.url" type="url" label="Git repo url"/>
            <q-input v-model="git.git_ref" type="url" label="Reference (branch/tag name)"/>
          </template>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" @click="close" />
        <q-btn flat
               label="Submit"
               color="primary"
               :disabled="!isProjectSelected"
               @click="onSubmit"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent } from 'vue'
import {Notify} from "quasar";

export default defineComponent({
  props: {
    buildItems: Array
  },
  data () {
    return {
      projectType: 'srpm_url',
      srpmUrl: null,
      git: {
        git_ref: null,
        url: null
      },
      opened: false,
      sourceTypes: [
        { label: 'Src-RPM URL', value: 'srpm_url' },
        { label: 'Git reference', value: 'git_ref' }
      ],
      refTypes: [

        { label: 'tag', value: 'git_tag' },
        { label: 'branch', value: 'git_branch' }
      ]
    }
  },
  computed: {
    buildRefText () {
      if (!this.selectedBuildRef) {
        return ''
      }
      const prefix = this.getGitRefPrefix(this.selectedBuildRef.type)
      return `${prefix}${this.selectedBuildRef.name}`
    },
    /**
     * Checks if a user selected project to build.
     *
     * @returns {Boolean} - true if user selected a project to build,
     *                      false otherwise.
     */
    isProjectSelected () {
      return this.srpmUrl || (this.git.git_ref && this.git.url)
    }
  },
  methods: {
    open () {
      this.opened = true
    },
    close () {
      this.opened = false
      this.projectType = 'srpm_url'
      this.srpmUrl = null
      this.git = { git_ref: null, url: null }
    },
    onSubmit () {
      let ref = { url: this.srpmUrl }
      if (!this.srpmUrl) {
        ref = JSON.parse(JSON.stringify(this.git))
      }

      const alreadyExistsCheck = this.buildItems.filter(item => {
        return item.url === ref.url && item.git_ref === ref.git_ref
      })
      if (alreadyExistsCheck.length) {
        const errorMsg = `Project "${ref.url}" was added earlier`
        Notify.create({ message: errorMsg, icon: 'warning', type: 'warning' })
        return
      }
      this.$emit('projectSelected', ref)
      this.close()
    },
    getGitRefPrefix (refType) {
      switch (refType) {
        case 'git_tag': return '#'
        case 'git_branch': return '⎇'
        default: return ''
      }
    }
  },
  components: {
  }
})
</script>

<style scoped>
</style>
