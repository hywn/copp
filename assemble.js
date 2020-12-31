#!/usr/bin/env -S deno run --allow-read

// all M instructions are 'memory referred to by register'.
// there is only one 'memory referred to by immediate' (lodRIM)
const
  lodRR = (a, b) => 0x00 + (a << 2) + b
, addRR = (a, b) => 0x10 + (a << 2) + b
, andRR = (a, b) => 0x20 + (a << 2) + b
, lodRM = (a, b) => 0x30 + (a << 2) + b
, lodMR = (a, b) => 0x40 + (b << 2) + a
, Stwid =  a     => 0x50 + (a << 2) + 0x0
, Snega =  a     => 0x50 + (a << 2) + 0x1
, Sbang =  a     => 0x50 + (a << 2) + 0x2
, lodpc =  a     => 0x50 + (a << 2) + 0x3
, lodRI =  a     => 0x60 + (a << 2) + 0x0
, addRI =  a     => 0x60 + (a << 2) + 0x1
, andRI =  a     => 0x60 + (a << 2) + 0x2
, lodRIM = a     => 0x60 + (a << 2) + 0x3 // wtf
, jleRR = (a, b) => 0x70 + (a << 2) + b   // wtf
, HALTT = ()     => 0x80

// assemble :: string -> Uint8Array
const assemble = text => {

	const instructions = {
		add: (a, b) => ({
			register:  [addRR(a.val, b.val)],
			immediate: [addRI(a.val), b.val]
		}[b.type]),
		and: (a, b) => ({
			register:  [andRR(a.val, b.val)],
			immediate: [andRI(a.val), b.val]
		}[b.type]),
		load: (a, b) => {
			const ex = f => f(a.val, b.val)
			if (a.type === 'memory')
				return [lodMR(a.val.val, b.val)]
			return {
				register:  [ex(lodRR)],
				immediate: [ex(lodRI), b.val],
				memory: {
					register:  [lodRM(a.val, b.val.val)],
					immediate: [lodRIM(a.val), b.val.val]
				}[b.val.type],
				PC:        [ex(lodpc)],
				label:     [ex(lodRI), b.val],
			}[b.type]
		},
		twiddle: a => [Stwid(a.val)],
		negate:  a => [Snega(a.val)],
		bang:    a => [Sbang(a.val)],
		jle: (a, b) => [jleRR(a.val, b.val)],
		halt: () => [HALTT()]
	}

	const labels = {}

	const parse_value = string => {
		if (string.match(/^r\d/))
			return {
				type: 'register',
				val: parseInt(string.slice(1))
			}
		if (string.match(/^\$.+/))
			return {
				type: 'immediate',
				val: 0xff & parseInt(string.slice(1))
			}
		if (string.match(/^:.+/))
			return {
				type: 'label',
				val: () => labels[string.slice(1)]
			}
		if (string.match(/^\[.+\]/))
			return {
				type: 'memory',
				val: parse_value(string.match(/^\[(.+)\]/)[1])
			}
		if (string == 'PC')
			return {
				type: 'PC',
				val: null
			}
	}

	const lines = text.replace(/;.*/g, '').split('\n').map(line => line.trim()).filter(x => x).reverse()

	const program = new Array(256).fill(0)

	for (let i = 0; i < 256;) {
		if (lines.length === 0)
			break
		const line = lines.pop()

		// labels
		if (line.startsWith('=')) {
			const [, label, here, rest] = line.match(/^=(\w+)(?:\[(.+?)\])? ?(.+)?/)
			if (here) i = parseInt(here)
			labels[label] = i
			for (const num of (rest || '').trim().split(/ +/).filter(x => x).map(x => parseInt(x)))
				program[i++] = num

			continue
		}

		const [instruction, ...args] = line.match(/\S+/g)

		const arg_vals = args.map(parse_value)

		if (!instructions[instruction])
			throw `invalid instruction '${instruction}' for line ${line}`

		const opcodes = instructions[instruction](...arg_vals)

		for (const opcode of opcodes)
			program[i++] = opcode
	}

	return new Uint8Array(program.map(x => typeof(x) === 'function' ? x() : x))
}

const CUT_OFF_ZEROES = bytes => {
	let last_nonzero = 255
	for (; last_nonzero >= 0; --last_nonzero)
		if (bytes[last_nonzero] !== 0)
			break
	if (last_nonzero === -1)
		return new Uint8Array([0])
	return bytes.slice(0, last_nonzero + 1)
}

if (!Deno.args.length)
	throw 'please specify file to assemble'

const input = new TextDecoder().decode(await Deno.readFile(Deno.args[0]))

console.log([...CUT_OFF_ZEROES(assemble(input))].map(x => x.toString(16).toUpperCase().padStart(2, '0')).join(' '))