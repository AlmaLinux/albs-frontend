<template>
  <q-dialog position="top"
            :content-css="{minWidth: '35vw'}"
            v-model="opened">

    <q-card style="width: 700px; height: 320px; max-width: 80vw;">
      <q-card-section>
        <div v-if="modularity" class="text-h6">Add a module to the build</div>
        <div v-else class="text-h6">Add a project to the build</div>
      </q-card-section>

      <q-card-section class="q-pt-none">

          <div class="row">
            <q-option-group v-model="projectType"
                            :options="sourceTypes"
                            type="radio"
                            inline/>
            <q-toggle v-if="! moduleRefs" class="text-grey-8 text-body1 q-pb-sm"
                      v-model="modularity"
                      :label="(modularity) ? 'Modules' : 'Projects'"/>
          </div>

          <template v-if="projectType === 'alma_git'">
            <q-select
                v-model="almaGitRepo"
                :options="almalinuxGitRepoNames"
                label="git.almalinux.org repo"
                use-input
                input-debounce="0"
                @update:model-value="onAlmalinuxRepoSelected"
                @filter="almaGitSelectFilter"
            />
            <q-select
                v-model="git.git_ref"
                :options="tagOptions.value"
                label="Tags/branches"
                use-input
                @filter="GitRefFilter"
                input-debounce="0"
            />
          </template>

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
               :loading="moduleRefsLoading"
               @click="onSubmit">
          <template v-slot:loading>
            <q-spinner class="on-left" />
          </template>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import {defineComponent, ref} from 'vue'
import {Notify} from "quasar"
import { BuildTaskRefType } from '../constants.js'

export default defineComponent({
  props: {
    buildItems: Array,
    platformName: String,
    moduleRefs: Boolean
  },
  data () {
    return {
      tagOptions: [],
      almaProjects: [],
      almaModules: [],
      modularity: false,
      projectType: 'alma_git',
      almaGitFilter: '',
      srpmUrl: null,
      almaGitRepo: null,
      moduleRefsLoading: false,
      git: {
        git_ref: null,
        url: null
      },
      opened: false,
      sourceTypes: [
        { label: 'git.almalinux.org', value: 'alma_git' },
        { label: 'Src-RPM URL', value: 'srpm_url' },
        { label: 'Git reference', value: 'git_ref' }
      ]
    }
  },
  created () {
    this.loadAlmaGitRefs()
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
    },
    almalinuxGitRepoNames () {
      let value = this.almalinuxGitRepos.map(item => {
        return {label: item.name, value: item.clone_url}
      })
      if (this.almaGitFilter !== '') {
        return value.filter(item => item.label.indexOf(this.almaGitFilter) > -1)
      }
      return value
    },
    almalinuxGitRepos () {
      if (this.modularity) {
        return this.almaModules
      } else {
        return this.almaProjects
      }
    },
    almalinuxGitRepoRefs () {
      let repo = this.almalinuxGitRepos.filter(item => item.clone_url === this.git.url)
      if (!repo.length) {
        return []
      }
      return repo[0].tags.concat(repo[0].branches)
    }
  },
  methods: {
    open () {
      this.opened = true
    },
    close () {
      this.opened = false
      this.projectType = 'alma_git'
      this.srpmUrl = null
      this.almaGitFilter = ''
      this.git = { git_ref: null, url: null }
      this.almaGitRepo = null
    },
    onSubmit () {
      let ref = { url: this.srpmUrl }
      if (!this.srpmUrl) {
        ref = JSON.parse(JSON.stringify(this.git))
      }
      switch (this.projectType) {
        case 'alma_git':
          let repo = this.almalinuxGitRepos.filter(
            item => item.clone_url === this.git.url)
          if (repo[0].tags.includes(ref.git_ref)) {
            ref.ref_type = BuildTaskRefType.GIT_TAG
          }
          else if (repo[0].branches.includes(ref.git_ref)) {
            ref.ref_type = BuildTaskRefType.GIT_BRANCH
          }
          this.almaGitRepo = null
          break
        case 'srpm_url':
          ref.ref_type = BuildTaskRefType.SRPM_URL
          break
        case 'git_ref':
          ref.ref_type = BuildTaskRefType.GIT_REF
          break
      }
      const alreadyExistsCheck = this.buildItems.filter(item => {
        return item.url === ref.url && item.git_ref === ref.git_ref
      })
      if (alreadyExistsCheck.length) {
        const errorMsg = `Project "${ref.url}" was added earlier`
        Notify.create({ message: errorMsg, icon: 'warning', type: 'warning' })
        return
      }
      if (this.modularity) {
        this.onSubmitModule(ref)
      }
      else {
        ref.mock_options = {}
        this.$emit('projectSelected', ref)
        this.close()
      }
    },
    onSubmitModule (ref) {
      let data = {
        ref: ref,
        platform_name: this.platformName
      }
      this.moduleRefsLoading = true
      this.$api.post('/builds/get_module_preview/', data)
        .then(response => {
          this.$emit('projectSelected', response.data)
          this.moduleRefsLoading = false
          this.close()
        })
        .catch(error => {
          this.moduleRefsLoading = false
          // TODO: show it to user
          console.log(error)
          this.close()
        })
    },
    loadAlmaGitRefs () {
      this.$api.get('/projects/alma/modularity')
        .then(response => {
          this.almaModules = response.data
        })
        .catch(error => {
          // TODO: add error here
        })
      this.$api.get('/projects/alma')
        .then(response => {
          this.almaProjects = response.data
        })
        .catch(error => {
          // TODO: add error here
        })
    },
    almaGitSelectFilter (value, update) {
      this.almaGitFilter = value
      update(() => {})
    },
    GitRefFilter (value, update) {
      this.tagOptions = ref(this.almalinuxGitRepoRefs)
      update(() => {
          const needle = value.toLowerCase()
          this.tagOptions.value = this.almalinuxGitRepoRefs.filter(v => v.toLowerCase().indexOf(needle) > -1)
        })
    },
    onAlmalinuxRepoSelected (value) {
      this.git.url = value.value
      this.git.git_ref = undefined
    }
  },
  components: {
  }
})
</script>

<style scoped>
</style>
