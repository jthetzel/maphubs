
exports.up = function(knex) {
  return  knex.raw(`
  INSERT INTO omh.page (page_id, config) VALUES ('config', '[]');
  `);
};

exports.down = function() {

};
