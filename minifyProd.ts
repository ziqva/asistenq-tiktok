import * as glob from 'glob'
import * as fs from 'fs'
import * as path from 'path'
import * as uglify from 'uglify-js'

const main = async(): Promise<void> => {
    const files: string[] = (await glob.glob('./dist/**/*.js', {
        // @ts-ignore
        // ignore: "./dist/controller/frontend/**/*"
    }))
    // .filter(x => !x.includes('controller\\frontend\\static'))
    for(const file of files) {
        const fullPath: string = path.join(__dirname, file)
        const fileName: string = path.basename(fullPath)
        console.log(`Processing: ${fileName}...`)
        const content: string = fs.readFileSync(fullPath, 'utf8')
        const result = uglify.minify(content, {
            toplevel: true,
            webkit: true,
            ie8: true,
            keep_fnames: false,
            sourceMap: false,
            compress: {
                inline: true,
                drop_console: true,
                dead_code: true,
                arguments: true,
                assignments: true,
                switches: true,
                sequences: true,
                side_effects: true,
                strings: true,
                webkit: true,
                reduce_funcs: true,
                reduce_vars: true,
                if_return: true,
                unsafe_regexp: true,
                evaluate: true,
                expression: true,
                hoist_exports: true,
                conditionals: true,
                collapse_vars: true,
                comparisons: true,
                unsafe_comps: true,
                typeofs: true,
                pure_getters: true,
                toplevel: true,
                unsafe_Function: true,
                varify: true,
                join_vars: true,
                hoist_vars: true,
                merge_vars: true,
                unsafe: true,
                unsafe_math: true,
                unsafe_proto: true,
                unsafe_undefined: true,
                unused: true,
                objects: true,
                properties: true,
                negate_iife: true,
                drop_debugger: true
            },
            output: {
                beautify: false,
                comments: false,
            },
            
        })
        fs.writeFileSync(fullPath, result.code, 'utf-8')
    }
}

main()