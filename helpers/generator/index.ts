export default {
  generateUuid: ({ length } = { length: 20 }) =>
    [...Array(length)]
      .map((_) => (~~(Math.random() * 36)).toString(36))
      .join(""),
};
