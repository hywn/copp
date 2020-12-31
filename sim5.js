/* change
{
	  type: 'read'  | 'write'
	, area: 'memory'| 'register'
	, index: byte | 'ir' | 'pc'
	, val?:  byte
}
*/

const signed_byte = byte => (byte & 0x80) ? -(0xff & -byte) : byte

// Uint8Array -> ([[change]], Uint8Array)
// loads given program into a new memory and runs it
// returns list of steps (which are [change]s) and final memory
const get_changes = program => {
	const REG = { ir: 0, pc: 0, 0: 0, 1: 0, 2: 0, 3: 0 }
	const MEM = new Uint8Array(256)
	MEM.set(program.slice(0, 256))

	const regr = i => ({ type: 'read', area: 'register', index: i })
	const regw = i => val => ({ type: 'write', area: 'register', index: i, val: REG[i] = 0xff & val })
	const memr = i => ({ type: 'read', area: 'memory', index: i })
	const memw = i => val => ({ type: 'write', area: 'memory', index: i, val: 0xff & (MEM[i] = val) }) // probably actually don't need the mask

	// wish had pc locally
	// technically should
	// so never include PC reads
	// wish had A, B instead of REG[a], REG[b].
	const icode_lookup = {
		0: (a, b) => [regr(b), regw(a)(REG[b])],
		// ok
		1: (a, b) => [regr(a), regr(b), regw(a)(REG[a] + REG[b])],
		2: (a, b) => [regr(a), regr(b), regw(a)(REG[a] & REG[b])],
		3: (a, b) => [regr(b), memr(REG[b]), regw(a)(MEM[REG[b]])],
		4: (a, b) => [regr(b), regr(a), memw(REG[b])(REG[a])],
		5: (a, b) => ({
			0: a => [regr(a), regw(a)(~REG[a])],
			1: a => [regr(a), regw(a)(-REG[a])],
			2: a => [regr(a), regw(a)(!REG[a] >>> 0)],
			3: a => [regr(a), regw(a)(REG['pc'])], // say that we read it again?? idk
		})[b](a),
		6: (a, b) => ({
			// not really sure how to handle immediate reading atm
			// write to register twice with 1 or once with 2??
			// 0, 1, 3 coverage.
			0: a => [regw('pc')(REG['pc'] + 1), memr(REG['pc']), regw(a)(MEM[REG['pc']])],
			1: a => [regr(a), regw('pc')(REG['pc'] + 1), memr(REG['pc']), regw(a)(REG[a] + MEM[REG['pc']])],
			2: a => [regr(a), regw('pc')(REG['pc'] + 1), memr(REG['pc']), regw(a)(REG[a] & MEM[REG['pc']])],
			3: a => [regw('pc')(REG['pc'] + 1), memr(REG['pc']), memr(MEM[REG['pc']]), regw(a)(MEM[MEM[REG['pc']]])]
		})[b](a),
		7: (a, b) => [
			regr(a), ...(signed_byte(REG[a]) <= 0
				? [regr(b), regw('pc')(REG[b])]
				: [{ nonzero: REG[a], ...regw('pc')(REG['pc'] + 1)}] // already always read pc... not great code design thoguh?
			)
		]
	}

	const steps = []
	for (;;) {
		const changes = []

		// read PC
		const pc = REG['pc']
		changes.push(regr('pc'))

		// read opcode into IR
		const opcode = MEM[pc]
		changes.push(memr(pc))
		changes.push(regw('ir')(opcode))

		const [reserved, icode, a, b] = [
			(opcode >> 7) & 0b1,
			(opcode >> 4) & 0b111,
			(opcode >> 2) & 0b11,
			opcode & 0b11
		]

		changes.push(...icode_lookup[icode](a, b))

		if (reserved) break

		// increment PC (if not a jump)
		if (icode !== 7)
			changes.push(regw('pc')(++REG['pc']))

		steps.push(changes)
	}

	return [steps, MEM]

}