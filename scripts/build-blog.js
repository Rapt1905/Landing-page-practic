const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const marked = require('marked');
const handlebars = require('handlebars');

async function buildBlog() {
    // Read blog template
    const template = await fs.readFile(
        path.join(__dirname, '../public/templates/blog.html'),
        'utf-8'
    );
    const blogTemplate = handlebars.compile(template);

    // Register helpers
    handlebars.registerHelper('formatDate', function(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    });

    // Read all markdown files
    const postsDir = path.join(__dirname, '../content/blog');
    const files = await fs.readdir(postsDir);
    const posts = [];

    for (const file of files) {
        if (path.extname(file) === '.md') {
            const content = await fs.readFile(
                path.join(postsDir, file),
                'utf-8'
            );
            const { data, content: markdown } = matter(content);
            const html = marked(markdown);
            
            const post = {
                ...data,
                content: html,
                url: `/blog/${path.basename(file, '.md')}`
            };
            
            posts.push(post);

            // Generate individual post page
            const postHtml = blogTemplate({
                ...post,
                currentYear: new Date().getFullYear()
            });

            const outputDir = path.join(__dirname, '../public/blog', path.basename(file, '.md'));
            await fs.mkdir(outputDir, { recursive: true });
            await fs.writeFile(path.join(outputDir, 'index.html'), postHtml);
        }
    }

    // Sort posts by date
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Generate blog index
    const indexTemplate = await fs.readFile(
        path.join(__dirname, '../public/blog/index.html'),
        'utf-8'
    );
    const compiledIndex = handlebars.compile(indexTemplate);
    const indexHtml = compiledIndex({ posts });
    await fs.writeFile(
        path.join(__dirname, '../public/blog/index.html'),
        indexHtml
    );
}

buildBlog().catch(console.error); 