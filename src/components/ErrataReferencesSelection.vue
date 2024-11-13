<template>
  <q-dialog
    position="top"
    :content-css="{minWidth: '35vw'}"
    v-model="opened"
    persistent
  >
    <q-card :style="cardStyle">
      <q-card-section>
        <div class="text-h6">
          <span v-if="Object.keys(reference).length !== 0">
            Edit Reference
          </span>
          <span v-else> Add Reference </span>
        </div>
      </q-card-section>

      <q-card-section>
        <q-input
          ref="refURL"
          label="URL"
          v-model="url"
          type="url"
          :rules="[(val) => validateURL(val) || 'This is not a URL']"
        />
        <div class="row q-gutter-md">
          <q-input
            v-if="Object.keys(reference).length !== 0"
            ref="refId"
            label="Ref ID"
            v-model="origRefId"
            class="col"
            :rules="[(val) => !!val || 'Ref ID is required']"
          />
          <q-input
            v-if="Object.keys(reference).length !== 0"
            label="Title"
            v-model="refTitle"
            class="col"
          />
          <q-select
            ref="refType"
            v-model="type"
            :options="refTypes"
            label="Type"
            :rules="[(val) => !!val.value || 'Type is required']"
            class="col"
          />
        </div>
      </q-card-section>
      <q-card-section
        v-if="type.value === 'cve'"
        class="row q-gutter-md"
        style="max-width: 100%"
      >
        <q-input
          ref="refCveId"
          label="CVE ID"
          v-model="cveId"
          class="col"
          :rules="[(val) => !!val || 'ID is required']"
        />
        <q-select
          ref="refCveSeverity"
          v-model="severity"
          class="col"
          :options="severities"
          label="Severity"
          :rules="[(val) => !!val || 'Severity is required']"
        />
        <q-input
          ref="refCvePublic"
          v-model="publicDate"
          type="date"
          class="col"
          label="Public Date"
          :rules="[(val) => !!val || 'Date is required']"
        />
        <q-input
          ref="refCvePublicTime"
          v-model="publicTime"
          type="time"
          class="col"
          label="Public Time"
          :rules="[(val) => !!val || 'Time is required']"
        />
      </q-card-section>
      <q-card-section
        v-if="type.value === 'cve'"
        class="row q-gutter-md"
        style="max-width: 100%"
      >
        <q-input
          ref="refCveCvss3"
          label="CVSS3"
          v-model="cvss3"
          class="col"
          :rules="[(val) => !!val || 'Field is required']"
        />
        <q-input label="CWE" v-model="cwe" class="col" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-card-actions align="right">
          <q-btn
            label="Cancel"
            v-close-popup
            flat
            color="negative"
            icon="cancel"
          />
          <q-btn
            v-if="Object.keys(reference).length !== 0"
            label="Edit Reference"
            @click="editRef()"
            color="primary"
            icon-right="done"
          />
          <q-btn
            v-else
            label="Add Reference"
            @click="addRef()"
            color="primary"
            icon-right="done"
          />
        </q-card-actions>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
  import {defineComponent} from 'vue'
  import {ErrataReferenceType} from '../constants'

  export default defineComponent({
    model: {
      event: 'addRef',
      event: 'editRef',
    },
    data() {
      return {
        reference: {},
        originRef: {},
        opened: false,
        url: '',
        type: '',
        severity: '',
        severities: ['Low', 'Moderate', 'Important', 'Critical'],
        cveId: '',
        publicDate: '',
        publicTime: '',
        cvss3: '',
        cwe: '',
        origRefId: '',
        refTitle: '',
      }
    },
    computed: {
      refTypes() {
        let types = []
        for (let key in ErrataReferenceType) {
          types.push({
            label: ErrataReferenceType[key].toUpperCase(),
            value: ErrataReferenceType[key],
          })
        }
        return types
      },
      cardStyle() {
        let style = 'width: 700px; max-width: 80vw;'
        if (this.type.value === 'cve') {
          return style.concat(' max-height: 550px;')
        } else {
          return style.concat(' max-height: 300;')
        }
      },
    },
    methods: {
      clearFields() {
        this.originRef = {}
        this.reference = {}
        this.url = ''
        this.type = ''
        this.origRefId = ''
        this.refTitle = ''
        this.severity = ''
        this.cveId = ''
        let currentdate = new Date()
        let yyyy = currentdate.getFullYear()
        let mm = String(currentdate.getMonth() + 1).padStart(2, '0')
        let dd = String(currentdate.getDate()).padStart(2, '0')
        this.publicDate = `${yyyy}-${mm}-${dd}`
        let hh = String(currentdate.getHours()).padStart(2, '0')
        let min = String(currentdate.getMinutes()).padStart(2, '0')
        let ss = String(currentdate.getSeconds()).padStart(2, '0')
        this.publicTime = `${hh}:${min}:${ss}`
        this.cvss3 = ''
        this.cwe = ''
      },
      open(reference = {}) {
        this.clearFields()
        if (Object.keys(reference).length !== 0) {
          this.originRef = reference
          this.reference = JSON.parse(JSON.stringify(reference))
          this.url = reference.href
          this.type = {
            label: reference.ref_type.toUpperCase(),
            value: reference.ref_type,
          }
          this.origRefId = reference.ref_id
          this.refTitle = reference.title
          if (reference.ref_type === 'cve') {
            this.severity = reference.cve.impact
            this.cveId = reference.cve.id
            let cveDate = reference.cve.public.split('T')
            this.publicDate = cveDate[0]
            this.publicTime = cveDate[1].replace('Z', '')
            this.cvss3 = reference.cve.cvss3
            this.cwe = reference.cve.cwe
          }
        }
        this.opened = true
      },
      close() {
        this.opened = false
      },
      validateURL(url) {
        const re = /^https?:\/\/.*/
        return re.test(url)
      },
      addRef() {
        if (!this.$refs.refURL.validate() || !this.$refs.refType.validate())
          return
        let refId = this.url
          .split('/')
          .filter((u) => u !== '')
          .pop()
          .replace('.html', '')
        let newRef = {
          href: this.url,
          ref_type: this.type.value,
          ref_id: refId,
          title: refId,
        }
        if (this.type.value === 'cve') {
          if (
            !this.$refs.refCveId.validate() ||
            !this.$refs.refCveSeverity.validate() ||
            !this.$refs.refCvePublic.validate() ||
            !this.$refs.refCvePublicTime.validate() ||
            !this.$refs.refCveCvss3.validate()
          )
            return
          newRef.cve = {
            id: this.cveId,
            cvss3: this.cvss3,
            cwe: this.cwe,
            impact: this.severity,
            public: `${this.publicDate}T${this.publicTime}Z`,
          }
        }
        this.$emit('addRef', newRef)
        this.close()
      },
      editRef() {
        if (
          !this.$refs.refURL.validate() ||
          !this.$refs.refType.validate() ||
          !this.$refs.refId.validate()
        )
          return
        let newRef = {
          href: this.url,
          ref_type: this.type.value,
          ref_id: this.origRefId,
          title: this.refTitle,
        }
        if (this.type.value === 'cve') {
          if (
            !this.$refs.refCveId.validate() ||
            !this.$refs.refCveSeverity.validate() ||
            !this.$refs.refCvePublic.validate() ||
            !this.$refs.refCvePublicTime.validate() ||
            !this.$refs.refCveCvss3.validate()
          )
            return
          newRef.cve = {
            id: this.cveId,
            cvss3: this.cvss3,
            cwe: this.cwe,
            impact: this.severity,
            public: `${this.publicDate}T${this.publicTime}Z`,
          }
        }
        this.$emit('editRef', this.originRef, newRef)
        this.close()
      },
    },
  })
</script>

<style scoped></style>
