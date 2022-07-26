<template>
    <div class="row justify-center q-col-gutter-sm q-ma-xs q-pl-xl">
        <div style="width: 70%">
            <q-card flat bordered>
                <q-card-section horizontal>
                    <q-card-section class="q-pt-xs" style="width: 100%">
                        <template v-if="loadingPage">
                            <q-skeleton type="text" style="width:30%"/>
                            <q-skeleton type="text" style="width:50%" class="text-h5 q-mt-sm q-mb-xs"/>
                            <q-skeleton height="150px" />
                        </template>
                        <template v-else>
                            <div class="text-overline">{{ product.name }} by 
                                <a :href="`mailto:${product.owner.email}`">{{ product.owner.username }}</a>
                            </div>
                            <div class="text-h5 q-mt-sm q-mb-xs">{{ product.title }}</div>
                            <div class="text-caption text-grey">
                                {{ product.description ? product.description : 'No description' }}
                            </div>
                        </template>
                    </q-card-section>
                    <q-card-section class="col-3 text-center">
                        <template v-if="loadingPage">
                            <q-skeleton type="text" class="q-pt-sm"/>
                            <q-skeleton height="50px"/>
                            <q-skeleton type="text" class="q-pt-lg"/>
                        </template>
                        <template v-else>
                            <div>
                                <b>Supported platforms:&nbsp;</b> <br/>
                                <span v-for="platform in product.platforms" :key="platform.id">
                                    {{ platform.name }} <br/>
                                </span>
                                <div class="q-pt-md">
                                    <b>Team:&nbsp;</b>
                                <a>{{product.team.name}}</a>
                            </div>
                            </div>
                        </template>
                    </q-card-section>
                </q-card-section>
                <q-card-section v-if="loadingPage" class="q-pt-md">
                    <q-skeleton style="height: 35px; width: 80%" />
                </q-card-section>
                <q-card-section v-else style="width: 80%">
                    <q-field label="Install product" stack-label>
                        <template v-slot:after>
                            <q-btn flat round
                                   target="_blank"
                                   :to="{path: `/documentation/COPR/COPR%20quick%20setup.md/`}"
                                   icon="description"
                                   @click.stop>
                                <q-tooltip>
                                    See documentation
                                </q-tooltip>
                            </q-btn>
                        </template>
                        <template v-slot:control>
                            <div class="self-center full-width text-overline" tabindex="0">
                                {{ installationString() }}
                            </div>
                        </template>
                        <template v-slot:append>
                            <q-btn flat round color="primary" icon="content_copy" @click="copyToClipboard(installationString())">
                                <q-tooltip>
                                    Click to copy
                                </q-tooltip>
                            </q-btn>
                        </template>
                    </q-field>
                </q-card-section>
                <q-card-section v-if="loadingPage" class="q-px-md">
                    <q-skeleton  type="rect" style="height: 40px" />
                </q-card-section>
                <q-card-section v-else class="q-px-none q-py-xs">
                    <!-- TODO: remove mockup and add real packages -->
                    <q-expansion-item label="Packages" expand-separator
                                                icon="shopping_cart" align="left">
                                <q-card>
                                    <q-card-section>
                                        <q-item dense>
                                            <q-table
                                                :rows="mockPackages"
                                                :columns="packCol"
                                                color="primary"
                                                wrap-cells
                                                flat
                                                style="width: 100%"
                                                hide-pagination
                                                :rows-per-page-options=[0]>
                                            </q-table>
                                        </q-item>
                                    </q-card-section>
                                </q-card>
                            </q-expansion-item>
                </q-card-section>
                <q-card-section class="q-px-md q-py-xs" v-if="loadingPage">
                    <q-skeleton type="rect" style="height: 40px" />
                </q-card-section>
                <q-card-section v-if="!loadingPage && product.builds.length !== 0" class="q-px-none q-py-xs">
                    <q-expansion-item label="Builds" expand-separator
                                      icon="build_circle">
                        <q-card>
                            <q-card-section v-for="build in product.builds"
                                            :key="build.id" class="no-padding">
                                <q-item dense>
                                    <router-link :to="`/build/${build.id}`" class="q-pl-md">
                                        Build {{ build.id }}
                                    </router-link>
                                </q-item>
                            </q-card-section>
                        </q-card>
                    </q-expansion-item>
                </q-card-section>
                <q-card-section v-if="loadingPage" class="q-py-xs q-px-md">
                    <q-skeleton type="rect" style="height: 30px" />
                </q-card-section>
                <q-card-section v-else class="q-py-xs q-px-none">
                    <q-expansion-item label="Repositories" expand-separator icon="storage" dense>
                        <q-card>
                            <q-card-section v-for="repo in product.repositories" :key="repo.id"
                                            class="no-padding">
                                <q-item dense>
                                    <a :href="repo.url" target="_blank" class="q-pl-md">
                                        {{ repo.name }}
                                    </a>
                                </q-item>
                            </q-card-section>
                        </q-card>
                    </q-expansion-item>
                </q-card-section>
                <q-separator/>

                <q-card-actions class="row justify-end q-gutter-sm q-pr-sm">
                    <q-skeleton type="circle" v-if="loadingPage"/>
                    <q-btn v-else color="negative" icon="delete" round @click="deleteProduct" :loading="loading">
                        <q-tooltip>
                            Delete product
                        </q-tooltip>
                    </q-btn>
                </q-card-actions>
            </q-card>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Notify } from 'quasar'
import { copyToClipboard } from '../utils'

export default defineComponent({
    props: {
        productId: String
    },
    data() {
        return {
            product: null,
            loadingPage: false,
            loading: false,
            mockPackages: [
                { name: 'alsa-sof-firmware', version: '#1.9.3-4.el8_6'},
                { name: 'cheese', version: '#3.28.0-4.el8_6'},
                { name: 'compat-openssl10 ', version: '#1.0.2o-4.el8_6'},
                { name: 'libinput', version: '#1.16.3-3.el8_6'},
                { name: 'nmstate', version: '#1.2.1-3.el8_6'},
                { name: 'pulseaudio', version: '#14.0-3.el8_6'},
                { name: 'rhel-system-roles-sap', version: '#3.2.0-2.el8_6'}
            ],
            packCol: [
                { name: 'name', required: true, align: 'left', label: 'Name', field: 'name'},
                { name: 'version', required: true, align: 'left', label: 'Version', field: 'version' },
            ]
        }
    },
    created () {
        this.loadProduct(this.productId)
    },
    methods: {
        copyToClipboard: copyToClipboard,
        installationString () {
            return `dnf copr --hub almalinux enable ${this.product.owner.username}/${this.product.name}`
        },
        loadProduct (productId) {
            this.loadingPage = true
            this.$api.get(`/products/${productId}/`)
                .then(response => {
                    this.loadingPage = false
                    this.product = response.data
                })
                .catch(error => {
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
        deleteProduct () {
            this.loading = true
            this.$api.delete(`products/${this.productId}/remove/`)
                .then(response => {
                    this.loading = false
                    this.$router.push(`/product-feed`)
                })
                .catch(error => {
                    this.loading = false
                    console.log(error)
                    Notify.create({
                        message: 'Failed to remove the product',
                        type: 'negative',
                        actions: [
                            { label: 'Dismiss', color: 'white', handler: () => {} }
                        ]
                    })
                })
        }
    }
})
</script>

<style>

</style>