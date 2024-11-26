module.exports = {
  resolve: {
    fallback: { 'path': require.resolve('path-browserify') },
    extensions: ['.jsx', '.js', '.tsx', '.ts'],
 }
};