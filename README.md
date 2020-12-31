# copp
I took [computer architecture](http://web.archive.org/web/20200701163551/https://www.cs.virginia.edu/luther/COA1/F2019/), and the professor introduced a toy instruction set for us to do assignments in.

for fun, I made:
- an interpreter (`sim5.js` that also produces a list of modifications)
- an assembler (`assemble.js`)

# notes
- the list of modifications produced by `sim5.js`'s `get_changes` probably contains some errors
- the interpreter might have errors
- the assembler might have errors
- the assembler is vanilla ES6, except it uses Deno for filesystem (run script with `./assemble.js hello.asm`; outputs uppercase hex separated by space to stdout [this is what we were asked to produce in assignments])
- the interpreter has no real interface and is just a function you have to hook up to stuff yourself

# the ISA
here is a graphical representation of an ISA opcode (the writeup uses ranges like [4, 7) which imo are not great)
<table>
<tr><th>reserved</th><th colspan='3'><code>icode</code></th><th colspan='2'><code>a</code></th><th colspan='2'><code>b</code></th><tr>
<tr><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>
</table>

- `reserved` causes the processor to halt
- `icode` describes what instruction to do
- `a` and `b` provide extra information used by instructions

the following symbols are used for the description of opcode behavior:
- `A`: contents of register `a`
- `B`: contents of register `b`

| `icode` | behavior |
| :-: | - |
| 0 | `A` <- `B` (contents of register `b` are put into register `a`) |
| 1 | `A` <- `A` + `B` |
| 2 | `A` <- `A` & `B` |
| 3 | `A` <- read from memory address `B` |
| 4 | `A` -> write to memory address `B`
| 5 | see below |
| 6 | see below |
| 7 | set PC to `B` if `A` <= 0 (`A` as a signed 2's-complement)

## 5: misc single-register operations
| `icode` | `b` | behavior |
| :-: | :-: | - |
| 5 | 0 | `A` <- ~`A` |
| 5 | 1 | `A` <- -`A` |
| 5 | 2 | `A` <- !`A` |
| 5 | 3 | `A` <- program counter |

## 6: misc immediate-addressed operations
where 'immediate value' means the value found in memory immediately after the opcode (i.e. `pc + 1`)

| `icode` | `b` | behavior |
| :-: | :-: | - |
| 6 | 0 | `A` <- immediate value |
| 6 | 1 | `A` <- `A` + immediate value |
| 6 | 2 | `A` <- `A` & immediate value |
| 6 | 3 | `A` <- read from memory at immediate value |

# assembly

## instructions/addressing modes

below are the instructions and 'addressing modes' you can use in the assembly language i made!!

args to instructions are separated by spaces despite the table documentation using commas. also, `M[R, I]` means `M[R]` OR `M[I]`, not actually `M[R, I]`

- `R` stands for register. lowercase r then number e.g. `r0`
- `I` stands for immediate. dollar sign then number e.g. `$1`
- `M[R]` stands for memory addressed by a register value. surround with square brackets e.g. `[r0]`
- `M[I]` stands for memory addressed by an immediate value. e.g. `[$0xA0]`
- `PC` stands for program counter (only one `load` instruction uses this)
- `L` stands for label (only one `load` instruction uses this). see special section below for more info
	- note: there isn't much difference between an immediate and a label, and I should've just let labels be special immediates... but oh well

you can think of the arrow pointing left `<-`.

so `add r0 r1` adds r1 to r0 (`r0 <- r1`); `load r0 r1` moves value of r1 into r0 (`r0 <- r1`).

the first `R` of `jle` is the value being compared (`jle isthislte? registerwithaddress`).

<table>
<tr><td rowspan='2'>add</td><td><code>R,R</code></td></tr>
<tr><td><code>R,I</code></td></tr>
<tr><td rowspan='2'>and</td><td><code>R,R</code></td></tr>
<tr><td><code>R,I</code></td></tr>
<tr><td rowspan='6'>load</td><td><code>R,R</code></td></tr>
<tr><td><code>R,I</code></td></tr>
<tr><td><code>R,M[R, I]</code></td></tr>
<tr><td><code>M[R],R</code></td></tr>
<tr><td><code>R,PC</code></td></tr>
<tr><td><code>R,L</code></td></tr>
<tr><td>twiddle</td><td><code>R</code></td></tr>
<tr><td>negate</td><td><code>R</code></td></tr>
<tr><td>bang</td><td><code>R</code></td></tr>
<!-- !!!!!!!!!!!!! -->
<tr><td>jle</td><td><code>R,R</code></td></tr>
</table>

## labels

you can use labels to represent places in memory. start a new line and use `=labelname`.

if you want to specify a specific location in memory to force the label to start at, you can use `=label[0x0A]` to make the location be `0x0A`.

you can put arbitrary bytes after a label separated by spaces, e.g. `=hello[4] 0x00 0x01 0x02`

when you want to use a label as an arg, use `:labelname`. e.g. `load r0 :mylabel`.

## comments

comments are started with `;` and run to end of line.

## examples

see `./asmexamples` for examples.