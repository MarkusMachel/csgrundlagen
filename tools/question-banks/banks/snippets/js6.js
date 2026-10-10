async function f() {
  console.log("f start");
  await null;
  console.log("f after await");
}
console.log("before");
f();
console.log("after");
