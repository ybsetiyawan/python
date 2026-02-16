<template>
  <v-app>
    <v-app-bar color="primary">
      <v-app-bar-title>KTP OCR</v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer permanent>
      <v-list>
        <v-list-item to="/admin/upload" router>
          Upload
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <v-container>
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>
