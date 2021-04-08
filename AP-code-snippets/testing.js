const fs = require('fs');
const chai = require('chai');
 
const expect = chai.expect;
 
const OoxmlTransformer = require('./OoxmlTransformer');
 
describe('OOXML -> CiceroMark', () => {
    const files= fs.readdirSync(__dirname+'/../test/data/ooxml/');
    //console.log(files);
    files.forEach(function(file) {
        it('converts ooxml to json', async () => {
            const ooxmlTransformer = new OoxmlTransformer();
            const ooxml = fs.readFileSync('test/data/ooxml/'+file,'utf-8');
            const testCiceroMark = fs.readFileSync('test/data/ciceroMark/' + file.replace(/.xml$/,'.json'), 'utf-8');
            const convertedObject = ooxmlTransformer.toCiceroMark(ooxml);
            expect(convertedObject).to.deep.equal(JSON.parse(testCiceroMark));
        });
    });
});
