const rehypePrism = require("@mapbox/rehype-prism")
const withImages = require("next-images")

const withMDX = require("@next/mdx")({
    extension: /\.mdx?$/,
    options: {
        remarkPlugins: [],
        rehypePlugins: [rehypePrism],
    },
})

module.exports = withImages(
    withMDX({
        images: {
            loader: "custom",
        },
        basePath: "/co-share-peer",
        assetPrefix: "/co-share-peer",
        eslint: {
            ignoreDuringBuilds: true,
        },
        pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
        trailingSlash: true,
        purgeCssPaths: ["pages/**/*", "components/**/*"],
        purgeCss: {
            safelist: ["body", "html"],
        },
    })
)
