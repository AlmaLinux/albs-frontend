<template>
    <div class="row q-col-gutter-sm q-ma-xs q-pl-xl">
        <div class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
            <q-card flat bordered>
                <q-card-section horizontal>
                    <q-card-section class="q-pt-xs" style="width: 100%">
                        <template v-if="loadingPage">
                            <q-skeleton type="text" style="width:30%"/>
                            <q-skeleton type="text" style="width:50%" class="text-h5 q-mt-sm q-mb-xs"/>
                            <q-skeleton height="150px" />
                        </template>
                        <template v-else>
                            <div class="text-overline">{{ product.name }}</div>
                            <div class="text-h5 q-mt-sm q-mb-xs">{{ product.title }}</div>
                            <div class="text-caption text-grey">
                                {{ product.description ? product.description : 'No description' }}
                            </div>
                        </template>
                    </q-card-section>
                    <q-card-section class="col-5 text-center">
                        <template v-if="loadingPage">
                            <q-skeleton type="text" class="q-pt-md"/>
                            <q-skeleton type="text" class="q-pt-lg"/>
                            <q-skeleton height="50px"/>
                        </template>
                        <template v-else>
                            <div class="q-pt-md">
                                <b>Team:&nbsp;</b>
                                <a>{{product.team.name}}</a>
                            </div>
                            <div class="q-py-lg">
                                <b>Supported platforms:&nbsp;</b> <br/>
                                <span v-for="platform in product.platforms" :key="platform.id">
                                    {{ platform.name }} <br/>
                                </span>
                            </div>
                        </template>
                    </q-card-section>
                </q-card-section>
                <q-card-section>
                    <q-skeleton type="rect" v-if="loadingPage"/>
                    <q-expansion-item v-else label="Repositories" expand-separator icon="storage" dense>
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

                <q-card-actions class="row justify-end q-gutter-sm q-pr-lg">
                    <q-skeleton type="circle" v-if="loadingPage"/>
                    <q-btn v-else color="negative" icon="delete" round @click="deleteProduct" :loading="loading">
                        <q-tooltip>
                            Delete product
                        </q-tooltip>
                    </q-btn>
                </q-card-actions>
            </q-card>
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12 col-xs-12" v-if="product">
            <q-card>
                <q-card-section class="q-pt-xs">
                    <div class="text-center text-bold">Packages:</div>
                </q-card-section>
                <q-card-section class="q-pt-xs">
                    <template v-for="project in mockPackages" :key="project.name">
                        <span class="text-weight-small text-primary">{{project.name}}</span>
                        <span class="text-grey-8">{{project.version}}</span>
                        <br/>
                    </template>
                </q-card-section>
                <q-card-section v-if="product.builds.length !== 0" >
                    <q-expansion-item label="Builds" expand-separator
                                      icon="build_circle">
                        <q-card>
                            <q-card-section v-for="build in product.builds"
                                            :key="build.id" class="no-padding">
                                <q-item dense>
                                    <router-link :to="`/build/${build.id}`">
                                        Build {{ build.id }}
                                    </router-link>
                                </q-item>
                            </q-card-section>
                        </q-card>
                    </q-expansion-item>
                </q-card-section>
            </q-card>
        </div>
    </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Notify } from 'quasar'

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
            ]
        }
    },
    created () {
        this.loadProduct(this.productId)
    },
    methods: {
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